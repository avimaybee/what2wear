import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { generateOutfitVariations } from '@/lib/helpers/nanoBananaClient';
import { uploadOutfitImages } from '@/lib/helpers/storageClient';

/**
 * POST /api/generate/outfit-visual
 *
 * Generates photorealistic silhouette renders of outfit recommendations using Nano Banana API.
 * Supports a hybrid pipeline:
 * 1. Preview generation (fast, low-resolution) returned immediately
 * 2. Full-resolution generation (async) queued for background processing
 *
 
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface GenerateOutfitRequest {
  recommendationId: string;
  items: Array<{
    id: string | number;
    imageUrl: string;
    maskUrl?: string | null;
    type: string;
    colors?: string[];
    material?: string | null;
    styleTags?: string[];
  }>;
  silhouette: 'male' | 'female' | 'neutral';
  stylePreset?: string;
  seed?: number;
  promptOverrides?: string;
  previewCount?: number;
  previewQuality?: 'low' | 'medium' | 'high';
}

interface GenerateOutfitResponse {
  success: boolean;
  jobId?: string;
  seed?: number;
  previewUrls?: string[];
  message?: string;
  metadata?: {
    generatedAt: string;
    previewDurationMs: number;
    prompt: string;
    style: string;
    previewCount: number;
    fullResStatus: 'queued' | 'processing' | 'pending';
    estimatedFullResDurationSec: number;
  };
  fullResUrls?: string[] | null;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

// ============================================================================
// Validation
// ============================================================================

function validateRequest(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const b = body as { [k: string]: unknown };

  if (!b.recommendationId || typeof b.recommendationId !== 'string') {
    errors.push('Field "recommendationId" is required and must be a string');
  }

  if (!Array.isArray(b.items) || (b.items as unknown[]).length < 3 || (b.items as unknown[]).length > 5) {
    errors.push('Field "items" must be an array of 3-5 items');
  }

  if (!Array.isArray(b.items) || !(b.items as unknown[]).every((it) => {
    if (typeof it === 'object' && it !== null) {
      const obj = it as { [k: string]: unknown };
      return Boolean(obj.id) && typeof obj.imageUrl === 'string' && typeof obj.type === 'string';
    }
    return false;
  })) {
    errors.push('Each item must have "id", "imageUrl", and "type"');
  }

  if (!['male', 'female', 'neutral'].includes(String(b.silhouette))) {
    errors.push('Field "silhouette" must be one of: "male", "female", "neutral"');
  }

  if (typeof b.previewCount === 'number' && ((b.previewCount as number) < 1 || (b.previewCount as number) > 5)) {
    errors.push('Field "previewCount" must be between 1 and 5');
  }

  if (typeof b.previewQuality === 'string' && !['low', 'medium', 'high'].includes(b.previewQuality as string)) {
    errors.push('Field "previewQuality" must be one of: "low", "medium", "high"');
  }

  if (typeof b.seed === 'number' && !Number.isInteger(b.seed)) {
    errors.push('Field "seed" must be an integer');
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Prompt Construction
// ============================================================================

function constructPhotorealisticPrompt(
  req: GenerateOutfitRequest,
  stylePreset: string
): string {
  // Build item descriptions
  const itemDescriptions = req.items
    .map((item) => {
      const colors = item.colors?.join(', ') || 'neutral color';
      const material = item.material || 'fabric';
      return `- ${item.type} in ${colors}, made of ${material}`;
    })
    .join('\n');

  // Construct base prompt
  let prompt = `Full body fashion portrait of a ${req.silhouette} silhouette wearing:
${itemDescriptions}

Style: ${stylePreset}
Lighting: Studio lighting with neutral background
Pose: Standing, full-body shot`;

  // Append overrides if provided
  if (req.promptOverrides) {
    prompt += `\n${req.promptOverrides}`;
  }

  return prompt;
}

// ============================================================================
// Nano Banana API Integration
// ============================================================================

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch (error: unknown) {
    logger.error('Error fetching image:', {
      url: imageUrl,
      error: getErrorMessage(error),
    });
    throw error;
  }
}

async function callNanoBananaAPI(
  prompt: string,
  itemImages: Array<{ url: string; mimeType: string }>,
  userId: string,
  jobId: string,
  params: {
    seed: number;
    outputCount: number;
    style: string;
    preview: boolean;
  }
): Promise<{ urls: string[] }> {
  try {
    // Fetch and convert images to base64
    logger.info('Fetching item images for API call', {
      itemCount: itemImages.length,
    });

    const imageBase64Array: string[] = [];
    for (const img of itemImages) {
      const base64 = await fetchImageAsBase64(img.url);
      imageBase64Array.push(base64);
    }

    // Call Nano Banana with variations
    const result = await generateOutfitVariations({
      prompt,
      itemImages: imageBase64Array.map((data) => ({
        data,
        mimeType: 'image/jpeg',
      })),
      seed: params.seed,
      outputCount: params.outputCount,
      variationCount: params.outputCount,
      style: params.style,
      preview: params.preview,
    });

    if (!result.base64Data || result.base64Data.length === 0) {
      throw new Error('No images generated from Nano Banana API');
    }

    // Upload generated images to storage
    logger.info('Uploading generated images to storage', {
      count: result.base64Data.length,
      preview: params.preview,
    });

    const urls = await uploadOutfitImages(
      userId,
      jobId,
      result.base64Data,
      params.preview
    );

    logger.info('Images uploaded successfully', {
      count: urls.length,
      seed: params.seed,
    });

    return { urls };
  } catch (error: unknown) {
    logger.error('Nano Banana API error:', {
      error: getErrorMessage(error),
      seed: params.seed,
    });
    throw error;
  }
}

// ============================================================================
// Queue / Job Creation
// ============================================================================

import { enqueueFullResolutionJob as queueJob, FullResGenerationJob } from '@/lib/workers/outfitGenerationWorker';

async function enqueueFullResolutionJob(
  jobId: string,
  userId: string,
  req: GenerateOutfitRequest,
  seed: number,
  prompt: string,
  stylePreset: string
): Promise<{ status: string; estimatedDurationSec: number }> {
  try {
    const jobData: FullResGenerationJob = {
      jobId,
      userId,
      recommendationId: req.recommendationId,
      seed,
      prompt,
      stylePreset,
      items: req.items,
      silhouette: req.silhouette,
      previewCount: req.previewCount,
    };

    const result = await queueJob(jobData);
    return result;
  } catch (error: unknown) {
    logger.error('Error enqueueing full-res job:', {
      error: getErrorMessage(error),
      jobId,
    });
    // Don't throw - if queueing fails, job still shows as queued to user
    // They can poll and see it eventually fails
    return {
      status: 'queued',
      estimatedDurationSec: 180,
    };
  }
}

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<GenerateOutfitResponse>> {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        },
        { status: 401 }
      );
    }

      logger.info('POST /api/generate/outfit-visual start', { userId: user.id });

    // 2. Parse and validate request
    let body: unknown;
    try {
      body = await request.json();
    } catch (_e) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON',
          },
        },
        { status: 400 }
      );
    }

    const { valid, errors } = validateRequest(body);
    if (!valid) {
      logger.error('Outfit visual request validation failed', {
        errors,
        bodyKeys: Object.keys(body as Record<string, unknown>),
      });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request payload',
            details: errors,
          },
        },
        { status: 400 }
      );
    }

  const req = body as GenerateOutfitRequest;

    logger.info('Validated outfit visual request', {
      userId: user.id,
      recommendationId: (req as GenerateOutfitRequest).recommendationId,
      itemCount: req.items.length,
      silhouette: req.silhouette,
      previewCount: req.previewCount || 3,
    });

    // 3. Verify all items belong to user (security check for swap flow)
    // This ensures users can only generate outfits with their own wardrobe items
    // Especially important for the swap flow where items are swapped with user's wardrobe
    const itemIds = req.items.map((item) => {
      const id = typeof item.id === 'string' ? parseInt(item.id, 10) : item.id;
      if (isNaN(id)) {
        throw new Error(`Invalid item ID format: ${item.id}`);
      }
      return id;
    });

    const { data: userItems, error: itemQueryError } = await supabase
      .from('clothing_items')
      .select('id')
      .eq('user_id', user.id)
      .in('id', itemIds);

    if (itemQueryError) {
      logger.error('Error querying user items:', itemQueryError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to verify item ownership',
          },
        },
        { status: 500 }
      );
    }

    // Security check: ensure all requested items exist and belong to authenticated user
    if (!userItems || userItems.length !== itemIds.length) {
      const foundIds = userItems?.map((i) => i.id) || [];
      const missingIds = itemIds.filter((id) => !foundIds.includes(id));
      
      logger.warn('Item ownership verification failed', {
        userId: user.id,
        requestedCount: itemIds.length,
        foundCount: userItems?.length || 0,
        missingIds,
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'One or more items do not belong to the authenticated user or do not exist',
          },
        },
        { status: 403 }
      );
    }

    // 4. Generate or validate seed
    const seed = req.seed || Math.floor(Math.random() * 2 ** 31);

    // 5. Prepare defaults
    const stylePreset = req.stylePreset || 'photorealistic';
    const previewCount = req.previewCount || 3;
    const previewQuality = req.previewQuality || 'medium';

    // 6. Generate job ID early (needed for storage)
    const jobId = `job_${user.id.substring(0, 8)}_${Date.now()}_${seed}`;

    // 7. Construct prompt
    const prompt = constructPhotorealisticPrompt(req, stylePreset);

    // 7. Fetch item images from storage or URLs
    // TODO: Convert imageUrls to base64 or handle accordingly
    const itemImages = req.items.map((item) => ({
      url: item.imageUrl,
      mimeType: 'image/jpeg',
      // data would be populated after fetching from storage
    }));

    // 8. Call Nano Banana API for preview generation
    const startTime = Date.now();
    let previewUrls: string[] = [];

    try {
      logger.info('Calling Nano Banana for preview generation', {
        userId: user.id,
        jobId,
        seed,
        previewCount,
      });
      const nanoBananaResult = await callNanoBananaAPI(
        prompt,
        itemImages,
        user.id,
        jobId,
        {
          seed,
          outputCount: previewCount,
          style: stylePreset,
          preview: true,
        }
      );
      previewUrls = nanoBananaResult.urls;
      logger.info('Nano Banana preview result', {
        userId: user.id,
        jobId,
        previewCount: previewUrls.length,
        samplePreview: previewUrls[0] || null,
      });
    } catch (error: unknown) {
      logger.error('Nano Banana API error:', { error: getErrorMessage(error) });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'GENERATION_FAILED',
            message: 'Image generation failed. Please try again.',
            details: {
              provider: 'nano_banana',
              error: getErrorMessage(error),
            },
          },
        },
        { status: 500 }
      );
    }

    const previewDurationMs = Date.now() - startTime;

    // 10. Store outfit_visuals record
    const { data: _outfitVisual, error: insertError } = await supabase
      .from('outfit_visuals')
      .insert([
        {
          user_id: user.id,
          recommendation_id: req.recommendationId,
          seed,
          style: stylePreset,
          prompt_text: prompt,
          preview_urls: previewUrls,
          job_id: jobId,
          job_status: 'queued',
          preview_quality: previewQuality,
          item_ids: req.items.map((item) => String(item.id)),
          silhouette: req.silhouette,
          preview_generated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (insertError) {
      logger.error('Error storing outfit_visual record:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to store generation record',
          },
        },
        { status: 500 }
      );
    }

      logger.info('Stored outfit_visual record', {
        userId: user.id,
        jobId,
        insertedCount: Array.isArray(_outfitVisual) ? _outfitVisual.length : 0,
        recordSample: Array.isArray(_outfitVisual) && _outfitVisual[0] ? { id: _outfitVisual[0].id, job_id: _outfitVisual[0].job_id } : null,
      });

    // 11. Enqueue full-resolution job
    const { status: queueStatus, estimatedDurationSec } = await enqueueFullResolutionJob(
      jobId,
      user.id,
      req,
      seed,
      prompt,
      stylePreset
    );

    // 12. Return success response
    return NextResponse.json(
      {
        success: true,
        jobId,
        seed,
        previewUrls,
        message: 'Preview generated successfully. Full-resolution job queued.',
        metadata: {
          generatedAt: new Date().toISOString(),
          previewDurationMs,
          prompt,
          style: stylePreset,
          previewCount,
          fullResStatus: queueStatus as 'queued' | 'processing' | 'pending',
          estimatedFullResDurationSec: estimatedDurationSec,
        },
        fullResUrls: null,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Unexpected error in POST /api/generate/outfit-visual:', getErrorMessage(error));
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: getErrorMessage(error),
        },
      },
      { status: 500 }
    );
  }
}
