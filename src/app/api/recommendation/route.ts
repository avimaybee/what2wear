import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponse, OutfitRecommendation, IClothingItem, WeatherData } from '@/lib/types';
import { filterByLastWorn, getRecommendation } from '@/lib/helpers/recommendationEngine';

interface InsufficientItemsError extends Error {
  customMessage?: string;
}
import { validateBody, recommendationRequestSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';

/**
 * POST /api/recommendation
 * Generate outfit recommendation based on weather and user wardrobe
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<OutfitRecommendation>>> {
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

    const recommendation = await generateRecommendation(user.id, lat, lon, occasion, request);

    return NextResponse.json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
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
): Promise<OutfitRecommendation> {
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

  // Check if user has minimum items for a basic outfit
  const hasTop = wardrobeItems.some(item => item.type?.trim().toUpperCase() === 'TOP' || item.type?.trim().toUpperCase() === 'OUTERWEAR');
  const hasBottom = wardrobeItems.some(item => item.type?.trim().toUpperCase() === 'BOTTOM');
  const hasFootwear = wardrobeItems.some(item => item.type?.trim().toUpperCase() === 'FOOTWEAR');

  const missingCategories = [];
  if (!hasTop) missingCategories.push('Top or Outerwear');
  if (!hasBottom) missingCategories.push('Bottom');
  if (!hasFootwear) missingCategories.push('Footwear');

  if (missingCategories.length > 0) {
    const foundTypes = [...new Set(wardrobeItems.map(item => item.type?.trim() || ''))];
    const missingItemsMessage = `To get a recommendation, please add at least one item for each of the following categories: ${missingCategories.join(', ')}. Your wardrobe currently has items of these types: ${foundTypes.join(', ')}.`;
    const error: InsufficientItemsError = new Error('INSUFFICIENT_ITEMS');
    error.customMessage = missingItemsMessage;
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

  const userPreferences = profile?.preferences || {};

  // Apply filtering logic
  let availableItems = wardrobeItems as IClothingItem[];
  
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
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (saveError) {
    logger.error('Failed to save recommendation:', saveError);
  }

  return {
    ...recommendation,
    id: savedRecommendation?.id,
  } as OutfitRecommendation & { id?: string };
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
        alerts: [],
        context: {
          weather: recommendation.weather_data,
        },
      },
    });
}
