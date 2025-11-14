import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger, generateRequestId } from '@/lib/logger';

/**
 * GET /api/generate/outfit-visual/[jobId]
 *
 * Retrieves the status and results of a background outfit generation job.
 * Used for polling to check if full-resolution images have been generated.
 *
 * Query parameters:
 *   - recommendationId (optional): Filter by recommendation ID
 */

interface JobStatusResponse {
  success: boolean;
  jobId?: string;
  status?: 'queued' | 'processing' | 'completed' | 'failed';
  previewUrls?: string[];
  finalUrls?: string[] | null;
  errorMessage?: string | null;
  metadata?: {
    createdAt: string;
    previewGeneratedAt: string | null;
    finalGeneratedAt: string | null;
    seed: number;
    style: string;
    estimatedCompleteAt?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse<JobStatusResponse>> {
  try {
    const { jobId } = await params;

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

    const requestId = generateRequestId('gen');
    const log = logger.child({ requestId, userId: user.id });

    // 2. Fetch outfit_visuals record
    const { data: outfitVisual, error: queryError } = await supabase
      .from('outfit_visuals')
      .select('*')
      .eq('job_id', jobId)
      .eq('user_id', user.id)
      .single();

    if (queryError) {
      if (queryError.code === 'PGRST116') {
        // Not found
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Job not found',
            },
          },
          { status: 404 }
        );
      }

      log.error('Error fetching outfit_visual', { error: queryError });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to retrieve job status',
          },
        },
        { status: 500 }
      );
    }

    // 3. Estimate completion time if still processing
    let estimatedCompleteAt: string | undefined;
    if (outfitVisual.job_status !== 'completed' && outfitVisual.job_status !== 'failed') {
      // Rough estimate: 2-3 minutes from creation
      const createdTime = new Date(outfitVisual.created_at).getTime();
      const estimatedTime = new Date(createdTime + 120000); // 2 minutes
      estimatedCompleteAt = estimatedTime.toISOString();
    }

    // 4. Return status response
    return NextResponse.json(
      {
        success: true,
        jobId: outfitVisual.job_id,
        status: outfitVisual.job_status,
        previewUrls: outfitVisual.preview_urls,
        finalUrls: outfitVisual.final_urls,
        errorMessage: outfitVisual.job_error_message,
        metadata: {
          createdAt: outfitVisual.created_at,
          previewGeneratedAt: outfitVisual.preview_generated_at,
          finalGeneratedAt: outfitVisual.final_generated_at,
          seed: outfitVisual.seed,
          style: outfitVisual.style,
          estimatedCompleteAt,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Unexpected error in GET /api/generate/outfit-visual/[jobId]', { error: msg });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
