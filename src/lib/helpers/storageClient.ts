import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * Uploads base64 encoded outfit images to Supabase storage.
 *
 * @param userId - The ID of the user.
 * @param jobId - The ID of the generation job.
 * @param base64Data - An array of base64 encoded image data.
 * @param isPreview - Whether the images are previews.
 * @returns An array of signed URLs for the uploaded images.
 */
export async function uploadOutfitImages(
  userId: string,
  jobId: string,
  base64Data: string[],
  isPreview: boolean
): Promise<string[]> {
  const supabase = await createClient();
  const urls: string[] = [];

  // Bucket + folder structure enforced by Supabase RLS policies:
  // outfit-visuals/{previews|final}/{userId}/{jobId}/image.png
  const BUCKET_ID = 'outfit-visuals';
  const ROOT_FOLDER = 'outfit-visuals';
  const SIGNED_URL_TTL_SECONDS = 60 * 30; // 30 minutes for client rendering & caching

  for (let i = 0; i < base64Data.length; i++) {
    const fileBody = Buffer.from(base64Data[i], 'base64');
    const fileType = 'image/png';
    const qualityFolder = isPreview ? 'previews' : 'final';
    const fileName = `img_${i + 1}.png`;
    const storagePath = `${ROOT_FOLDER}/${qualityFolder}/${userId}/${jobId}/${fileName}`;

    const { error } = await supabase.storage
      .from(BUCKET_ID)
      .upload(storagePath, fileBody, {
        contentType: fileType,
        upsert: true,
      });

    if (error) {
      logger.error('Error uploading outfit image to bucket', {
        error,
        storagePath,
        bucket: BUCKET_ID,
      });
      throw new Error(`Failed to upload image ${i + 1}/${base64Data.length}`);
    }

    const { data, error: signedUrlError } = await supabase.storage
      .from(BUCKET_ID)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

    if (signedUrlError || !data?.signedUrl) {
      logger.error('Error creating signed URL for outfit image', {
        error: signedUrlError,
        storagePath,
        bucket: BUCKET_ID,
      });
      throw new Error(`Failed to create signed URL for image ${i + 1}/${base64Data.length}`);
    }

    urls.push(data.signedUrl);
  }

  return urls;
}

/**
 * Creates a signed URL for a clothing image.
 *
 * @param path - The storage path of the file.
 * @param expiresIn - The duration in seconds for which the URL is valid.
 * @returns The signed URL.
 */
export async function createSignedUrl(path: string, expiresIn: number = 60): Promise<string> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from('clothing_images')
      .createSignedUrl(path, expiresIn);

    if (error) {
      logger.error('Error creating signed URL:', { error, path });
      throw new Error('Could not create signed URL.');
    }

    return data.signedUrl;
  } catch (error) {
    logger.error('Unexpected error creating signed URL:', { error, path });
    throw error;
  }
}
