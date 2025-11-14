import { logger } from '@/lib/logger';

/**
 * Nano Banana / Gemini 2.5 Flash Image API Integration
 * Handles text-to-image generation for photorealistic silhouette renders
 */

export interface GenerateImageParams {
  prompt: string;
  itemImages: Array<{ data: string; mimeType: string }>;
  seed: number;
  outputCount: number;
  style: string;
  preview: boolean;
}

export interface GenerationResult {
  urls: string[];
  base64Data?: string[];
}

/**
 * Style preset configuration for Nano Banana
 */
const STYLE_PRESETS: Record<
  string,
  {
    temperature: number;
    topP: number;
    prompt?: string;
  }
> = {
  photorealistic: {
    temperature: 0.6,
    topP: 0.9,
    prompt: 'photorealistic fashion photography',
  },
  editorial: {
    temperature: 0.7,
    topP: 0.95,
    prompt: 'high-fashion editorial style',
  },
  casual: {
    temperature: 0.75,
    topP: 0.95,
    prompt: 'casual lifestyle photography',
  },
  professional: {
    temperature: 0.65,
    topP: 0.9,
    prompt: 'professional business attire',
  },
  athletic: {
    temperature: 0.7,
    topP: 0.93,
    prompt: 'athletic and active wear',
  },
};

/**
 * Call Gemini 2.5 Flash Image API (Nano Banana) to generate outfit silhouette
 * Returns base64-encoded image data
 * 
 * Uses the Gemini 2.5 Flash Image model which supports:
 * - Text-to-image generation
 * - Multi-image composition
 * - Response modalities in both text and images
 */
export async function generateImageWithNanoBanana(
  params: GenerateImageParams
): Promise<GenerationResult> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable not set');
    }

    const preset = STYLE_PRESETS[params.style] || STYLE_PRESETS.photorealistic;

    // Build image parts for inlineData - these are the clothing item reference images
    const imageParts = params.itemImages.map((img) => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.data,
      },
    }));

    // Enhance prompt with style preset and composition instructions
    const enhancedPrompt = `${params.prompt}

Style: ${preset.prompt || params.style}

Create a photorealistic full-body fashion portrait showing a person wearing these clothing items together. 
Use the provided reference images to accurately represent the colors, textures, and styles of each garment.
The composition should be: clean studio lighting, neutral background, full-body standing pose.
Ensure the outfit looks cohesive and fashionable.`;

    // Build request body for Gemini 2.5 Flash Image
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: enhancedPrompt,
            },
            ...imageParts,
          ],
        },
      ],
      generationConfig: {
        temperature: preset.temperature,
        topP: preset.topP,
        topK: 40,
        maxOutputTokens: 8192, // Allow for both text and image response
        seed: params.seed,
        responseModalities: ['IMAGE'], // Request image output
      },
    };

    if (process.env.NODE_ENV !== 'production') {
      logger.info('Calling Gemini 2.5 Flash Image API for outfit generation', {
        seed: params.seed,
        style: params.style,
        itemCount: params.itemImages.length,
        preview: params.preview,
      });
    }

    // Call Gemini API with 2.5 Flash Image model
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Unknown error';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData?.error?.message || errorText;
      } catch {
        errorMessage = errorText;
      }
      throw new Error(
        `Gemini API error: ${response.status} - ${errorMessage}`
      );
    }

    const data = await response.json();

    // Extract image data from response
    // Gemini 2.5 Flash Image returns images in the response parts
    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content ||
      !data.candidates[0].content.parts
    ) {
      throw new Error('Invalid response structure from Gemini API');
    }

    // Find all image parts in the response (can have multiple)
    const parts: unknown[] = data.candidates[0].content.parts;
    const responseImageParts = parts.filter((part) => {
      if (part && typeof part === 'object' && part !== null) {
        return 'inlineData' in part;
      }
      return false;
    }) as Array<{ inlineData?: { data?: string; mimeType?: string } }>;

    if (responseImageParts.length === 0) {
      throw new Error('No image data in Gemini API response');
    }

    // Extract base64 data from all image parts
    const base64DataArray: string[] = [];
    for (const imagePart of responseImageParts) {
      if (imagePart.inlineData?.data) {
        base64DataArray.push(imagePart.inlineData.data);
      }
    }

    if (base64DataArray.length === 0) {
      throw new Error('Failed to extract image data from response');
    }

    if (process.env.NODE_ENV !== 'production') {
      logger.info('Gemini API generation successful', {
        seed: params.seed,
        imageCount: base64DataArray.length,
        totalDataSize: base64DataArray.reduce((sum, d) => sum + d.length, 0),
      });
    }

    return {
      urls: [], // URLs will be populated after upload to storage
      base64Data: base64DataArray,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (process.env.NODE_ENV !== 'production') {
      logger.error('Nano Banana API error:', {
        error: msg,
        seed: params.seed,
      });
    }
    throw error;
  }
}

/**
 * Generate multiple variations of an outfit by making sequential calls
 * with slightly different seeds to create variations
 */
export async function generateOutfitVariations(
  params: GenerateImageParams & { variationCount: number }
): Promise<GenerationResult> {
  const base64Data: string[] = [];

  for (let i = 0; i < params.variationCount; i++) {
    try {
      // Use same base seed but vary it slightly for diversity
      const variationSeed = params.seed + i;

      const result = await generateImageWithNanoBanana({
        ...params,
        seed: variationSeed,
      });

      if (result.base64Data) {
        base64Data.push(...result.base64Data);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to generate variation ${i}:`, msg);
      // Continue with other variations even if one fails
      throw error; // Rethrow to stop generation on first failure (can be changed)
    }
  }

  return {
    urls: [],
    base64Data,
  };
}
