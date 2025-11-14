import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { generateOutfitVariations } from '@/lib/helpers/nanoBananaClient';
import { uploadOutfitImages } from '@/lib/helpers/storageClient';

/**
 * Dev-only endpoint to test Nano Banana -> upload -> DB flow.
 * Usage: set NODE_ENV=development or ENABLE_DEBUG_LOGS=true and call this route.
 */
export async function GET(request: NextRequest) {
  try {
    const allowed = process.env.NODE_ENV === 'development' || process.env.ENABLE_DEBUG_LOGS === 'true';
    if (!allowed) {
      return NextResponse.json({ success: false, message: 'Debug endpoint disabled' }, { status: 403 });
    }

    const supabase = await createClient();

    // Allow overriding userId and recommendationId via query params (dev-only)
    const url = new URL(request.url);
    const queryUserId = url.searchParams.get('userId');
    const queryRecommendationId = url.searchParams.get('recommendationId');

    // Use a dev user id from env or fallback
    const devUserId = queryUserId || process.env.DEV_TEST_USER_ID || 'dev-test-user';
    const recommendationId = queryRecommendationId || 'dev_reco';
    const jobId = `dev_job_${Date.now()}`;

    // Sample public images
    const sampleUrls = [
      'https://images.unsplash.com/photo-1503342452485-86f7d6a663a2?w=1024&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1520975925854-6d7f8b9b9f22?w=1024&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1520975919517-5f0f3a7d2b56?w=1024&q=80&auto=format&fit=crop',
    ];

    logger.info('Debug generate-test triggered', { jobId, devUserId });

    // fetch helper
    async function fetchBase64(url: string) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
      const ab = await res.arrayBuffer();
      return Buffer.from(ab).toString('base64');
    }

    const itemImages: Array<{ url: string; mimeType: string }> = [];
    const inlineImages: Array<{ data: string; mimeType: string }> = [];
    for (const u of sampleUrls) {
      try {
        const b64 = await fetchBase64(u);
        inlineImages.push({ data: b64, mimeType: 'image/jpeg' });
        itemImages.push({ url: u, mimeType: 'image/jpeg' });
      } catch (e) {
        logger.error('Failed to fetch sample image', String(e));
      }
    }

    if (inlineImages.length === 0) {
      return NextResponse.json({ success: false, message: 'Failed to fetch sample images' }, { status: 500 });
    }

    // call nano banana
    const prompt = 'Dev test: photorealistic full-body fashion portrait, studio lighting, neutral background.';

    const result = await generateOutfitVariations({
      prompt,
      itemImages: inlineImages,
      seed: Math.floor(Math.random() * 100000),
      outputCount: 1,
      variationCount: 1,
      style: 'photorealistic',
      preview: true,
    });

    if (!result.base64Data || result.base64Data.length === 0) {
      return NextResponse.json({ success: false, message: 'No images generated' }, { status: 500 });
    }

    // upload
    const urls = await uploadOutfitImages(devUserId, jobId, result.base64Data, true);

    // insert record
    const { data: inserted, error: insertError } = await supabase
      .from('outfit_visuals')
      .insert([
        {
          user_id: devUserId,
          recommendation_id: recommendationId,
          seed: 0,
          style: 'photorealistic',
          prompt_text: prompt,
          preview_urls: urls,
          job_id: jobId,
          job_status: 'completed',
          preview_quality: 'medium',
          item_ids: sampleUrls.map((_, i) => String(i + 1)),
          silhouette: 'neutral',
          preview_generated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (insertError) {
      logger.error('Failed to insert outfit_visuals record', String(insertError));
      return NextResponse.json({ success: false, message: 'DB insert failed', details: insertError }, { status: 500 });
    }

    logger.info('Debug generate-test completed', { jobId, urlsCount: urls.length });

    return NextResponse.json({ success: true, jobId, urls, inserted }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Unexpected error in debug generate-test', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
