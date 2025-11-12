import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * Storage utilities for outfit visual images
 * Handles upload and URL generation for preview and full-resolution images
 */

export interface UploadImageResult {
  path: string;
  signedUrl: string;
  expiresIn: number; // seconds
}

/**
 * Upload base64-encoded image to Supabase Storage
 * Returns signed URL for retrieval
 */
export async function uploadOutfitImage(
  userId: string,
  jobId: string,
  base64Data: string,
  imageIndex: number,
  isPreview: boolean = true
): Promise<UploadImageResult> {
  try {
    const supabase = await createClient();

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate filename with seed/index info for traceability
    const typePrefix = isPreview ? 'preview' : 'final';
    const filename = `${typePrefix}_${Date.now()}_${imageIndex}.jpg`;
    const folderPrefix = isPreview ? 'previews' : 'final';
    const path = `outfit-visuals/${folderPrefix}/${userId}/${jobId}/${filename}`;

    logger.info('Uploading outfit image', {
      userId,
      jobId,
      path,
      isPreview,
      size: buffer.length,
    });

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('outfit-visuals')
      .upload(path, buffer, {
        contentType: 'image/jpeg',
        cacheControl: isPreview ? '3600' : '86400', // 1 hour for preview, 1 day for final
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Generate signed URL (24-hour expiry for both preview and final)
    const expiresIn = 24 * 3600; // 24 hours
    const { data: signedData, error: signError } = await supabase.storage
      .from('outfit-visuals')
      .createSignedUrl(path, expiresIn);

    if (signError) {
      throw signError;
    }

    logger.info('Image uploaded successfully', {
      path,
      signed: !!signedData?.signedUrl,
    });

    return {
      path,
      signedUrl: signedData?.signedUrl || '',
      expiresIn,
    };
  } catch (error: any) {
    logger.error('Error uploading outfit image:', {
      error: error.message,
      userId,
      jobId,
    });
    throw error;
  }
}

/**
 * Upload multiple images and return array of signed URLs
 */
export async function uploadOutfitImages(
  userId: string,
  jobId: string,
  base64DataArray: string[],
  isPreview: boolean = true
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < base64DataArray.length; i++) {
    try {
      const result = await uploadOutfitImage(
        userId,
        jobId,
        base64DataArray[i],
        i,
        isPreview
      );
      urls.push(result.signedUrl);
    } catch (error) {
      logger.error(`Failed to upload image ${i}:`, error);
      throw error;
    }
  }

  return urls;
}

/**
 * Delete outfit images from storage
 * Removes both preview and final images for a job
 */
export async function deleteOutfitImages(
  userId: string,
  jobId: string
): Promise<void> {
  try {
    const supabase = await createClient();

    // Delete preview folder
    const previewPath = `outfit-visuals/previews/${userId}/${jobId}`;
    const { data: previewList, error: previewListError } =
      await supabase.storage.from('outfit-visuals').list(previewPath);

    if (!previewListError && previewList && previewList.length > 0) {
      const previewFiles = previewList
        .filter((f) => !f.name.startsWith('.'))
        .map((f) => `${previewPath}/${f.name}`);

      if (previewFiles.length > 0) {
        await supabase.storage.from('outfit-visuals').remove(previewFiles);
      }
    }

    // Delete final folder
    const finalPath = `outfit-visuals/final/${userId}/${jobId}`;
    const { data: finalList, error: finalListError } = await supabase.storage
      .from('outfit-visuals')
      .list(finalPath);

    if (!finalListError && finalList && finalList.length > 0) {
      const finalFiles = finalList
        .filter((f) => !f.name.startsWith('.'))
        .map((f) => `${finalPath}/${f.name}`);

      if (finalFiles.length > 0) {
        await supabase.storage.from('outfit-visuals').remove(finalFiles);
      }
    }

    logger.info('Outfit images deleted', { userId, jobId });
  } catch (error: any) {
    logger.error('Error deleting outfit images:', {
      error: error.message,
      userId,
      jobId,
    });
    // Don't throw - deletion failure shouldn't fail the whole operation
  }
}
