import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponse, OutfitRecommendation, IClothingItem, WeatherData, ClothingType, WeatherAlert } from '@/lib/types';
import { filterByLastWorn, getRecommendation } from '@/lib/helpers/recommendationEngine';

interface InsufficientItemsError extends Error {
  customMessage?: string;
}
import { validateBody, recommendationRequestSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
 
// DB row type used for items fetched from Supabase
type DBClothingRow = Partial<IClothingItem> & {
  id?: number;
  category?: string | null;
  type?: string | null;
  rawType?: string | null;
  rawCategory?: string | null;
  normalizedType?: ClothingType | null;
};

const TYPE_ALIASES: Record<string, ClothingType> = {
  // Type field values (Title Case)
  top: 'Top',
  tops: 'Top',
  outerwear: 'Outerwear',
  bottom: 'Bottom',
  bottoms: 'Bottom',
  footwear: 'Footwear',
  accessory: 'Accessory',
  accessories: 'Accessory',
  headwear: 'Headwear',
  
  // Old schema ENUM values (original clothing_category enum)
  'shirt': 'Top',
  't-shirt': 'Top',
  'jacket': 'Outerwear',
  'pants': 'Bottom',
  'shoes': 'Footwear',
  
  // Common variations
  shirts: 'Top',
  tee: 'Top',
  tshirt: 'Top',
  blouse: 'Top',
  sweater: 'Top',
  jumper: 'Top',
  polo: 'Top',
  tank: 'Top',
  crewneck: 'Top',
  jackets: 'Outerwear',
  coat: 'Outerwear',
  coats: 'Outerwear',
  hoodie: 'Outerwear',
  hoodies: 'Outerwear',
  cardigan: 'Outerwear',
  cardigans: 'Outerwear',
  blazer: 'Outerwear',
  windbreaker: 'Outerwear',
  trousers: 'Bottom',
  jeans: 'Bottom',
  joggers: 'Bottom',
  shorts: 'Bottom',
  skirt: 'Bottom',
  leggings: 'Bottom',
  sweats: 'Bottom',
  shoe: 'Footwear',
  sneakers: 'Footwear',
  boots: 'Footwear',
  sandals: 'Footwear',
  loafers: 'Footwear',
  heels: 'Footwear',
  trainers: 'Footwear',
  belt: 'Accessory',
  scarf: 'Accessory',
  bag: 'Accessory',
  bags: 'Accessory',
  jewelry: 'Accessory',
  watch: 'Accessory',
  hat: 'Headwear',
  hats: 'Headwear',
  cap: 'Headwear',
  caps: 'Headwear',
  beanie: 'Headwear',
  beanies: 'Headwear',
  headband: 'Headwear'
};

const normalizeTypeValue = (value?: string | null): ClothingType | null => {
  if (!value) return null;
  const normalizedKey = value.trim().toLowerCase();
  return TYPE_ALIASES[normalizedKey] || null;
};

const deriveClothingType = (item: Partial<IClothingItem>): ClothingType | null => {
  const typeFromField = normalizeTypeValue(item.type as string | null);
  if (typeFromField) return typeFromField;

  const typeFromCategory = normalizeTypeValue(item.category as string | null);
  if (typeFromCategory) return typeFromCategory;

  return null;
};

const describeDetectedTypes = (items: Array<{ normalizedType: ClothingType | null; rawType?: string | null; rawCategory?: string | null }>): string[] => {
  return Array.from(new Set(items.map(item => {
    if (item.normalizedType) {
      return item.normalizedType;
    }
    if (item.rawType && item.rawType.trim()) {
      return `Unmapped type: ${item.rawType.trim()}`;
    }
    if (item.rawCategory && item.rawCategory.trim()) {
      return `Category only: ${item.rawCategory.trim()}`;
    }
    return 'Unlabeled item';
  })));
};

/**
 * POST /api/recommendation
 * Generate outfit recommendation based on weather and user wardrobe
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const validatedData = await validateBody(request, recommendationRequestSchema) as { lat: number; lon: number; occasion?: string };
    const { lat, lon, occasion = "" } = validatedData;

    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Generating recommendation for:', { lat, lon, occasion });
    }
    const recommendation = await generateRecommendation(user.id, lat, lon, occasion, request);
    if (process.env.NODE_ENV === 'development') {
      console.log('✓ Recommendation generated successfully');
    }

    return NextResponse.json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error generating recommendation:', errorMsg);
    logger.error('Error generating recommendation:', error);
    
    // Handle special cases for empty/insufficient wardrobe
    if (error instanceof Error) {
      if (error.message === 'EMPTY_WARDROBE') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'EMPTY_WARDROBE',
            message: 'Your wardrobe is empty. Add some clothing items to get started!',
            needsWardrobe: true
          },
          { status: 200 }
        );
      }
      
      if (error.message === 'INSUFFICIENT_ITEMS') {
        const insufficientItemsError = error as InsufficientItemsError;
        return NextResponse.json(
          { 
            success: false, 
            error: 'INSUFFICIENT_ITEMS',
            message: insufficientItemsError.customMessage || 'You need at least one top, one bottom, and one pair of shoes to create an outfit.',
            needsWardrobe: true
          },
          { status: 200 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate recommendation' 
      },
      { status: 500 }
    );
  }
}

/**
 * Generate fresh outfit recommendation
 * Extracted to separate function for better organization
 */
async function generateRecommendation(
  userId: string,
  lat: number,
  lon: number,
  occasion: string,
  request: NextRequest
): Promise<{
  recommendation: {
    outfit: IClothingItem[];
    confidence_score: number;
    reasoning: string;
    dress_code: string;
    weather_alerts: WeatherAlert[];
    id?: string | number;
  };
  weather: WeatherData;
  alerts: WeatherAlert[];
}> {
  const supabase = await createClient();

  // Fetch user's wardrobe
  const { data: wardrobeItems, error: wardrobeError } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('user_id', userId);

  if (wardrobeError) {
    throw new Error('Failed to fetch wardrobe items');
  }

  // Handle empty wardrobe gracefully - this is expected for new users
  if (!wardrobeItems || wardrobeItems.length === 0) {
    throw new Error('EMPTY_WARDROBE');
  }

  let normalizedWardrobeItems = (wardrobeItems as DBClothingRow[]).map((item) => {
    const normalizedType = deriveClothingType(item as DBClothingRow);
    return {
      ...(item as DBClothingRow),
      normalizedType,
      rawType: (item.type ?? null) as string | null,
      rawCategory: (item.category ?? null) as string | null,
    } as DBClothingRow & { normalizedType: ClothingType | null; rawType: string | null; rawCategory: string | null };
  });

  // Log normalized items for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('=== Wardrobe Items Debug ===');
    console.log('Total items:', wardrobeItems.length);
    console.log('Normalized items:', normalizedWardrobeItems.map(item => ({
      id: item.id,
      name: item.name,
      rawType: item.rawType,
      rawCategory: item.rawCategory,
      normalizedType: item.normalizedType
    })));
  }

  const itemsNeedingBackfill = normalizedWardrobeItems.filter(item => (!item.rawType || !item.rawType.trim()) && item.normalizedType);

  if (itemsNeedingBackfill.length > 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Backfilling ${itemsNeedingBackfill.length} items with missing types`);
    }
    try {
      const results = await Promise.all(itemsNeedingBackfill.map(item =>
        supabase
          .from('clothing_items')
          .update({ type: item.normalizedType })
          .eq('id', item.id)
          .eq('user_id', userId)
      ));
      if (process.env.NODE_ENV === 'development') {
        console.log('Backfill results:', results.map(r => ({ error: r.error, count: r.count })));
      }
      
      // CRITICAL: Refetch the items after backfilling to get the updated types
      const { data: updatedWardrobeItems, error: refetchError } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', userId);
      
      if (!refetchError && updatedWardrobeItems) {
        // Re-normalize with the updated data
        normalizedWardrobeItems = (updatedWardrobeItems as DBClothingRow[]).map((item) => {
          const normalizedType = deriveClothingType(item as DBClothingRow);
          return {
            ...(item as DBClothingRow),
            normalizedType,
            rawType: (item.type ?? null) as string | null,
            rawCategory: (item.category ?? null) as string | null,
          } as DBClothingRow & { normalizedType: ClothingType | null; rawType: string | null; rawCategory: string | null };
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Re-fetched items after backfill:', normalizedWardrobeItems.map(item => ({
            id: item.id,
            name: item.name,
            rawType: item.rawType,
            normalizedType: item.normalizedType
          })));
        }
      }
    } catch (updateError) {
      logger.error('Failed to backfill missing clothing item types', updateError);
    }
  }

  const hasTop = normalizedWardrobeItems.some(item => item.normalizedType === 'Top' || item.normalizedType === 'Outerwear');
  const hasBottom = normalizedWardrobeItems.some(item => item.normalizedType === 'Bottom');
  const hasFootwear = normalizedWardrobeItems.some(item => item.normalizedType === 'Footwear');

  if (process.env.NODE_ENV === 'development') {
    console.log('Category check:', { hasTop, hasBottom, hasFootwear });
  }

  const missingCategories: string[] = [];
  if (!hasTop) missingCategories.push('Top or Outerwear');
  if (!hasBottom) missingCategories.push('Bottom');
  if (!hasFootwear) missingCategories.push('Footwear');

  if (missingCategories.length > 0) {
    const detectedTypes = describeDetectedTypes(normalizedWardrobeItems);
    const wardrobeCount = normalizedWardrobeItems.length;
    const missingItemsMessageParts = [
      `To get a recommendation, add at least one item in each missing category: ${missingCategories.join(', ')}.`,
      `We found ${wardrobeCount} total items in your wardrobe.`,
    ];

    if (detectedTypes.length > 0) {
      missingItemsMessageParts.push(`Detected wardrobe entries: ${detectedTypes.join(', ')}.`);
    }

    if (itemsNeedingBackfill.length > 0) {
      missingItemsMessageParts.push('We tried to auto-fix missing item types. If the issue persists, edit those items in your wardrobe.');
    } else {
      missingItemsMessageParts.push('Make sure each clothing item has an accurate type (Top, Bottom, Footwear, etc.).');
    }

    const error: InsufficientItemsError = new Error('INSUFFICIENT_ITEMS');
    error.customMessage = missingItemsMessageParts.join(' ');
    throw error;
  }
  // Fetch weather data
  const weatherUrl = new URL('/api/weather', request.url);
  weatherUrl.searchParams.set('lat', lat.toString());
  weatherUrl.searchParams.set('lon', lon.toString());
  weatherUrl.searchParams.set('provider', 'openWeather');
  
  const weatherResponse = await fetch(weatherUrl.toString(), {
    headers: request.headers,
  });
  
  if (!weatherResponse.ok) {
    throw new Error('Failed to fetch weather data');
  }

  const weatherData = await weatherResponse.json();
  const weather: WeatherData = weatherData.data.weather;
  const alerts = weatherData.data.alerts;

  // Fetch user preferences
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', userId)
    .single();

  // Convert preference scores to arrays of items with positive scores
  const userPreferences: Record<string, string[]> = {
    colors: [],
    styles: [],
    materials: [],
  };
  
  if (profile?.preferences) {
    const prefs = profile.preferences as Record<string, Record<string, number>>;
    
    if (prefs.colors) {
      userPreferences.colors = Object.entries(prefs.colors)
        .filter(([_, score]) => score > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([color]) => color);
    }
    
    if (prefs.styles) {
      userPreferences.styles = Object.entries(prefs.styles)
        .filter(([_, score]) => score > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([style]) => style);
    }
    
    if (prefs.materials) {
      userPreferences.materials = Object.entries(prefs.materials)
        .filter(([_, score]) => score > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([material]) => material);
    }
  }

  // Apply filtering logic
  let availableItems = normalizedWardrobeItems.map(item => ({
    ...item,
    type: (item.normalizedType ?? normalizeTypeValue(item.rawType) ?? 'Top') as ClothingType,
  })) as IClothingItem[];
  
  // Filter by last worn date
  availableItems = filterByLastWorn(availableItems);

  // Generate the recommendation
  const recommendation = getRecommendation(
    availableItems,
    {
      weather,
      user_preferences: userPreferences,
    },
    {
      weather_alerts: alerts,
    }
  );

  // Store recommendation in database for feedback tracking
  const { data: savedRecommendation, error: saveError } = await supabase
    .from('outfit_recommendations')
    .insert({
      user_id: userId,
      outfit_items: recommendation.items.map((i: IClothingItem) => i.id),
      weather_data: weather,
      confidence_score: recommendation.confidence_score,
      reasoning: recommendation.reasoning,
      detailed_reasoning: recommendation.detailed_reasoning || null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (saveError) {
    logger.error('Failed to save recommendation:', saveError);
  }

  // Transform recommendation data to match frontend expectations
  // Ensure clothing item image URLs are safe to use by the client (signed URLs for storage)
  const SIGNED_URL_TTL = 60 * 60; // 1 hour

  const outfitWithSignedUrls = await Promise.all(
    recommendation.items.map(async (item) => {
      if (item.image_url) {
        try {
          const url = new URL(item.image_url);
          const pathSegments = url.pathname.split('/clothing_images/');

          if (pathSegments.length > 1 && pathSegments[1]) {
            const path = pathSegments[1];
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('clothing_images')
              .createSignedUrl(path, SIGNED_URL_TTL);

            if (!signedUrlError && signedUrlData?.signedUrl) {
              return { ...item, image_url: signedUrlData.signedUrl };
            }
          }
        } catch (e) {
          logger.error(`Error creating signed URL for recommendation item ${item.id}:`, e);
          // fallthrough to return original item
        }
      }
      return item;
    })
  );

  // Generate outfit visual preview immediately
  let outfitVisualUrls: string[] = [];
  try {
    if (savedRecommendation?.id && outfitWithSignedUrls.length >= 3) {
      // Build the request payload with proper field names
      const requestPayload = {
        recommendationId: String(savedRecommendation.id),
        items: outfitWithSignedUrls.filter(item => item.image_url).map((item) => ({
          id: String(item.id),
          imageUrl: item.image_url || '',
          type: item.type,
          colors: item.color ? [item.color] : [],
          material: item.material || null,
          styleTags: item.style_tags || [],
        })),
        silhouette: 'female' as const, // Default; could be inferred from user preferences
        stylePreset: 'photorealistic',
        previewCount: 1,
        previewQuality: 'medium' as const,
      };

      // Validate we have enough items
      if (requestPayload.items.length < 3) {
        logger.warn('Not enough outfit items with images for visual generation', {
          itemsWithImages: requestPayload.items.length,
          totalItems: outfitWithSignedUrls.length,
        });
      } else {
        const baseUrl = request.url.split('/api/')[0];
        
        logger.info('Generating outfit visual with payload:', {
          recommendationId: requestPayload.recommendationId,
          itemCount: requestPayload.items.length,
          itemIds: requestPayload.items.map(i => i.id),
        });

        const generateVisualsResponse = await fetch(`${baseUrl}/api/generate/outfit-visual`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${request.headers.get('authorization') || ''}`,
          },
          body: JSON.stringify(requestPayload),
        });

        if (generateVisualsResponse.ok) {
          const visualData = await generateVisualsResponse.json();
          if (visualData.success && visualData.previewUrls) {
            outfitVisualUrls = visualData.previewUrls;
            logger.info('Outfit visual generated successfully', {
              recommendationId: savedRecommendation.id,
              urlCount: outfitVisualUrls.length,
            });
          }
        } else {
          const errorText = await generateVisualsResponse.text();
          logger.warn('Failed to generate outfit visual preview', {
            recommendationId: savedRecommendation.id,
            status: generateVisualsResponse.status,
            error: errorText,
          });
        }
      }
    }
  } catch (visualError) {
    logger.warn('Error generating outfit visual:', {
      error: visualError instanceof Error ? visualError.message : String(visualError),
    });
    // Don't fail the recommendation if visual generation fails
  }

  const transformedData = {
    recommendation: {
      outfit: outfitWithSignedUrls,
      confidence_score: recommendation.confidence_score,
      reasoning: recommendation.reasoning,
      detailed_reasoning: recommendation.detailed_reasoning || null,
      dress_code: 'Casual', // Default, could be enhanced from context
      weather_alerts: recommendation.alerts || [],
      id: savedRecommendation?.id,
      outfit_visual_urls: outfitVisualUrls,
    },
    weather: weather,
    alerts: recommendation.alerts || [],
  };

  return transformedData;
}

/**
 * GET /api/recommendation
 * Get latest recommendation for the user
 * UPDATED: Recommendation #4 - Added validation middleware
 */
export async function GET(_request: NextRequest): Promise<NextResponse<ApiResponse<OutfitRecommendation>>> {
  const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get latest recommendation
    const { data: recommendation, error: recError } = await supabase
      .from('outfit_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recError || !recommendation) {
      return NextResponse.json(
        { success: false, error: 'No recommendations found' },
        { status: 404 }
      );
    }

    // Fetch clothing items for the recommendation
    const { data: items } = await supabase
      .from('clothing_items')
      .select('*')
      .in('id', recommendation.outfit_items);

    return NextResponse.json({
      success: true,
      data: {
        id: recommendation.id,
        items: items || [],
        confidence_score: recommendation.confidence_score,
        reasoning: recommendation.reasoning,
        detailed_reasoning: recommendation.detailed_reasoning || null,
        alerts: [],
        context: {
          weather: recommendation.weather_data,
        },
      },
    });
}
