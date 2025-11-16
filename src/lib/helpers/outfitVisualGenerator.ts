import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { generateOutfitVariations } from '@/lib/helpers/nanoBananaClient';
import { uploadOutfitImages } from '@/lib/helpers/storageClient';

/**
 * Centralized outfit visual generation logic
 * Can be called from API routes or directly from server components
 */

interface OutfitItem {
  id: string;
  imageUrl: string;
  type: string;
  colors?: string[];
  material?: string | null;
  styleTags?: string[];
}

export interface GenerateOutfitVisualResult {
  success: boolean;
  previewUrls?: string[];
  jobId?: string;
  error?: {
    code: string;
    message: string;
    retryAfterMs?: number;
  };
}

let previewCooldownUntil: number | null = null;

const isPreviewGenerationPaused = (): { paused: boolean; remainingMs?: number } => {
  if (previewCooldownUntil && Date.now() < previewCooldownUntil) {
    return { paused: true, remainingMs: previewCooldownUntil - Date.now() };
  }
  return { paused: false };
};

function constructPhotorealisticPrompt(
  items: OutfitItem[],
  silhouette: 'male' | 'female' | 'neutral',
  stylePreset: string
): string {
  // Build item descriptions
  const itemDescriptions = items
    .map((item) => {
      const colors = item.colors?.join(', ') || 'neutral color';
      const material = item.material || 'fabric';
      return `- ${item.type} in ${colors}, made of ${material}`;
    })
    .join('\n');

  // Construct base prompt
  const prompt = `Full body fashion portrait of a ${silhouette} silhouette wearing:
${itemDescriptions}

Style: ${stylePreset}
Lighting: Studio lighting with neutral background
Pose: Standing, full-body shot`;

  return prompt;
}

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (process.env.NODE_ENV !== 'production') {
      logger.error('Error fetching image:', {
        url: imageUrl,
        error: msg,
      });
    }
    throw error;
  }
}

export async function generateOutfitVisualForRecommendation(
  recommendationId: string,
  items: OutfitItem[],
  silhouette: 'male' | 'female' | 'neutral' = 'neutral',
  stylePreset: string = 'photorealistic',
  previewCount: number = 1,
  previewQuality: 'low' | 'medium' | 'high' = 'medium'
): Promise<GenerateOutfitVisualResult> {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      };
    }

    // Validate input
    if (items.length < 3) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Need at least 3 items to generate outfit visual',
        },
      };
    }

    const cooldownState = isPreviewGenerationPaused();
    if (cooldownState.paused) {
      const remainingSeconds = cooldownState.remainingMs
        ? Math.ceil(cooldownState.remainingMs / 1000)
        : undefined;
      logger.warn('Skipping outfit visual generation due to active cooldown', {
        recommendationId,
        remainingMs: cooldownState.remainingMs,
      });
      return {
        success: false,
        error: {
          code: 'QUOTA_COOLDOWN',
          message:
            remainingSeconds !== undefined
              ? `Outfit previews temporarily paused. Please try again in ${remainingSeconds}s.`
              : 'Outfit previews temporarily paused. Please try again later.',
          retryAfterMs: cooldownState.remainingMs,
        },
      };
    }

    // Generate seed
    const seed = Math.floor(Math.random() * 2 ** 31);

    // Generate job ID
    const jobId = `job_${user.id.substring(0, 8)}_${Date.now()}_${seed}`;

    // Construct prompt
    const prompt = constructPhotorealisticPrompt(items, silhouette, stylePreset);

    // Fetch item images as base64
    logger.info('Fetching item images for visual generation', {
      itemCount: items.length,
      recommendationId,
    });

    const imageBase64Array: string[] = [];
    for (const item of items) {
      if (!item.imageUrl) continue;
      try {
        const base64 = await fetchImageAsBase64(item.imageUrl);
        imageBase64Array.push(base64);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.warn(`Failed to fetch image for item ${item.id}:`, { error: msg });
        // Continue with other images
      }
    }

    if (imageBase64Array.length < 3) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Could not fetch enough item images (need at least 3)',
        },
      };
    }

    // Call Nano Banana API for generation
    logger.info('Calling Nano Banana API for outfit generation', {
      seed,
      itemCount: imageBase64Array.length,
      previewCount,
    });

    const result = await generateOutfitVariations({
      prompt,
      itemImages: imageBase64Array.map((data) => ({
        data,
        mimeType: 'image/jpeg',
      })),
      seed,
      outputCount: previewCount,
      variationCount: previewCount,
      style: stylePreset,
      preview: true,
    });

    if (!result.base64Data || result.base64Data.length === 0) {
      return {
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: 'No images generated from Nano Banana API',
        },
      };
    }

    // Upload generated images to storage
    logger.info('Uploading generated images to storage', {
      count: result.base64Data.length,
    });

    const previewUrls = await uploadOutfitImages(
      user.id,
      jobId,
      result.base64Data,
      true // isPreview
    );

    // Successful generation clears any cooldown
    previewCooldownUntil = null;

    // Store outfit_visuals record
    const { error: insertError } = await supabase
      .from('outfit_visuals')
      .insert([
        {
          user_id: user.id,
          recommendation_id: recommendationId,
          seed,
          style: stylePreset,
          prompt_text: prompt,
          preview_urls: previewUrls,
          job_id: jobId,
          job_status: 'completed', // Preview is complete, full-res would be queued
          preview_quality: previewQuality,
          item_ids: items.map((item) => String(item.id)),
          silhouette,
          preview_generated_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      logger.error('Error storing outfit_visual record:', { error: insertError });
      // Don't fail the request if DB insert fails, we still have the URLs
    }

    return {
      success: true,
      previewUrls,
      jobId,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const quotaRetryMs =
      typeof error === 'object' &&
      error !== null &&
      'retryAfterMs' in error &&
      typeof (error as { retryAfterMs?: unknown }).retryAfterMs === 'number'
        ? (error as { retryAfterMs?: number }).retryAfterMs
        : undefined;
    const errorCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: string }).code
        : undefined;

    if (errorCode === 'QUOTA_EXCEEDED') {
      const retryAfterMs = quotaRetryMs ?? 5 * 60 * 1000;
      previewCooldownUntil = Date.now() + retryAfterMs;
      const retrySeconds = Math.ceil(retryAfterMs / 1000);
      logger.warn('Gemini quota exceeded; pausing outfit previews', {
        recommendationId,
        retryAfterMs,
      });
      return {
        success: false,
        error: {
          code: 'QUOTA_EXCEEDED',
          message: `Outfit previews temporarily disabled due to Gemini quota limits. Please try again in ${retrySeconds}s.`,
          retryAfterMs,
        },
      };
    }

    logger.error('Error generating outfit visual:', {
      error: msg,
      recommendationId,
      code: errorCode,
    });
    return {
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: msg,
      },
    };
  }
}
