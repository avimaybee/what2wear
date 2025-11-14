import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { generateOutfitVariations } from '@/lib/helpers/nanoBananaClient';
import { uploadOutfitImages } from '@/lib/helpers/storageClient';

/**
 * Background worker for full-resolution outfit generation
 * In production, this would be integrated with BullMQ or Cloud Tasks
 * For now, provides structure for async job processing
 */

export interface FullResGenerationJob {
  jobId: string;
  userId: string;
  recommendationId: string;
  seed: number;
  prompt: string;
  stylePreset: string;
  items: Array<{
    id: string | number;
    imageUrl: string;
    type: string;
  }>;
  silhouette: string;
  previewCount?: number;
}

/**
 * Enqueue a full-resolution generation job
 * In production with BullMQ, this would add to Redis queue
 * For MVP, we'll use a scheduled Supabase function or store for polling
 */
export async function enqueueFullResolutionJob(
  job: FullResGenerationJob
): Promise<{ jobId: string; status: string; estimatedDurationSec: number }> {
  try {
    logger.info('Enqueueing full-res generation job', {
      jobId: job.jobId,
      userId: job.userId,
      seed: job.seed,
    });

    // For MVP: Store job data in a queue table that can be polled/processed
    const supabase = await createClient();
    
    // Check if we have a generation_queue table; if not, we'll process synchronously
    const { data: queueData, error: queueError } = await supabase
      .from('generation_queue')
      .insert([
        {
          job_id: job.jobId,
          user_id: job.userId,
          job_data: job,
          status: 'pending',
          created_at: new Date().toISOString(),
          attempted_at: null,
          completed_at: null,
          error: null,
        },
      ])
      .select();

    if (queueError && queueError.code === 'PGRST202') {
      // Table doesn't exist - process synchronously instead
      if (process.env.NODE_ENV === 'development') {
        logger.info('generation_queue table not found, processing job synchronously');
      }
      
      // Process in the background (fire and forget)
      processGenerationJob(job).catch((error) => {
        logger.error('Background job processing failed:', {
          error: error instanceof Error ? error.message : String(error),
          jobId: job.jobId,
        });
      });

      return {
        jobId: job.jobId,
        status: 'processing',
        estimatedDurationSec: 180,
      };
    }

    if (queueError) {
      throw queueError;
    }

    if (queueData) {
      logger.info('Job queued successfully', {
        jobId: job.jobId,
        queueId: queueData[0]?.id,
      });
    }

    // In MVP without proper queue infrastructure, process immediately
    // (in production, a background worker would consume this queue)
    processGenerationJob(job).catch((error) => {
      logger.error('Background job processing failed:', {
        error: error instanceof Error ? error.message : String(error),
        jobId: job.jobId,
      });
    });

    return {
      jobId: job.jobId,
      status: 'queued',
      estimatedDurationSec: 180,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Error enqueueing job:', {
      error: msg,
      jobId: job.jobId,
    });
    throw error;
  }
}

/**
 * Process a full-resolution generation job
 * This would be called by the worker
 */
export async function processGenerationJob(
  jobData: FullResGenerationJob
): Promise<{ success: boolean; jobId: string; finalUrls: string[] }>
{
  logger.info('Processing full-res generation job', {
    jobId: jobData.jobId,
    userId: jobData.userId,
    seed: jobData.seed,
  });

  try {
    // Update job status to processing
    const supabase = await createClient();
    await supabase
      .from('outfit_visuals')
      .update({ job_status: 'processing' })
      .eq('job_id', jobData.jobId)
      .eq('user_id', jobData.userId);

    // Generate full-resolution images (higher quality)
    logger.info('Generating full-resolution outfit images', {
      jobId: jobData.jobId,
      seed: jobData.seed,
      outputCount: jobData.previewCount || 3,
    });

    const result = await generateOutfitVariations({
      prompt: jobData.prompt,
      itemImages: jobData.items.map((_item) => ({
        data: '', // Will be fetched in nanoBananaClient
        mimeType: 'image/jpeg',
      })),
      seed: jobData.seed,
      outputCount: jobData.previewCount || 3,
      variationCount: jobData.previewCount || 3,
      style: jobData.stylePreset,
      preview: false, // Full resolution
    });

    if (!result.base64Data || result.base64Data.length === 0) {
      throw new Error('No images generated from full-res generation');
    }

    // Upload full-resolution images
    logger.info('Uploading full-resolution images', {
      jobId: jobData.jobId,
      count: result.base64Data.length,
    });

    const finalUrls = await uploadOutfitImages(
      jobData.userId,
      jobData.jobId,
      result.base64Data,
      false // Not preview
    );

    // Update database with final URLs and completion status
    const { error: updateError } = await supabase
      .from('outfit_visuals')
      .update({
        final_urls: finalUrls,
        job_status: 'completed',
        final_generated_at: new Date().toISOString(),
      })
      .eq('job_id', jobData.jobId)
      .eq('user_id', jobData.userId);

    if (updateError) {
      throw updateError;
    }

    logger.info('Full-res generation completed', {
      jobId: jobData.jobId,
      urlCount: finalUrls.length,
    });

    return {
      success: true,
      jobId: jobData.jobId,
      finalUrls,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Error processing full-res generation job:', {
      error: msg,
      jobId: jobData.jobId,
    });

    // Update database with error status
    try {
      const supabase = await createClient();
      await supabase
        .from('outfit_visuals')
        .update({
          job_status: 'failed',
          job_error_message: msg,
        })
        .eq('job_id', jobData.jobId)
        .eq('user_id', jobData.userId);
    } catch (dbError: unknown) {
      const dbMsg = dbError instanceof Error ? dbError.message : String(dbError);
      logger.error('Failed to update job error status', { error: dbMsg });
    }

    throw error;
  }
}
