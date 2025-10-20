import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponse, OutfitRecommendation, IClothingItem, WeatherData, CalendarEvent, HealthActivity } from '@/lib/types';
import { 
  filterByLastWorn, 
  filterByDressCode, 
  getDressCodeFromEvents, 
  adjustInsulationForActivity,
  getRecommendation,
} from '@/lib/helpers/recommendationEngine';
import { 
  validateBody, 
  recommendationRequestSchema 
} from '@/lib/validation';
import { cache, CACHE_PREFIX, DEFAULT_TTL } from '@/lib/cache';
import { checkRateLimit, createRateLimitResponse, addRateLimitHeaders } from '@/lib/ratelimit';

/**
 * POST /api/recommendation
 * Generate outfit recommendation based on weather, calendar, and user preferences
 * UPDATED: Recommendation #4 - Added comprehensive validation
 * UPDATED: Recommendation #5 - Added caching with 15-minute TTL
 * UPDATED: Recommendation #6 - Added rate limiting (50 requests/hour)
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

  // Check rate limit
  const rateLimitResult = await checkRateLimit(request, { policy: 'recommendation' });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult) as NextResponse<ApiResponse<OutfitRecommendation>>;
  }

  // Validate and sanitize request body
  const validatedData = await validateBody(request, recommendationRequestSchema);
  const { lat, lon, occasion = "" } = validatedData;

  // Generate cache key based on location, occasion, and user
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLon = Math.round(lon * 100) / 100;
  const cacheKey = `${user.id}:${roundedLat}:${roundedLon}:${occasion || 'default'}`;

  // Try to get from cache first
  // Note: Cache TTL is shorter for recommendations as they depend on many factors
  const cachedRecommendation = await cache.get<OutfitRecommendation>(
    cacheKey,
    {
      prefix: CACHE_PREFIX.RECOMMENDATION,
    }
  );

  // Return cached recommendation if found and not expired
  if (cachedRecommendation) {
    return NextResponse.json({
      success: true,
      data: cachedRecommendation,
      message: 'Recommendation from cache',
    });
  }

  // Cache miss - generate fresh recommendation
  const recommendation = await generateRecommendation(user.id, lat, lon, occasion, request);

  // Cache the recommendation (15 minutes TTL)
  await cache.set(cacheKey, recommendation, {
    prefix: CACHE_PREFIX.RECOMMENDATION,
    ttl: DEFAULT_TTL.MEDIUM * 3, // 15 minutes
  });

  const response = NextResponse.json({
    success: true,
    data: recommendation,
  });

  // Add rate limit headers
  return addRateLimitHeaders(response, rateLimitResult) as NextResponse<ApiResponse<OutfitRecommendation>>;
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

  if (!wardrobeItems || wardrobeItems.length === 0) {
    throw new Error('No clothing items found in wardrobe');
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

  // Fetch calendar events
  let calendarEvents: CalendarEvent[] = [];
  try {
    const calendarUrl = new URL('/api/calendar/events', request.url);
    calendarUrl.searchParams.set('hours', '24');
    
    const calendarResponse = await fetch(calendarUrl.toString(), {
      headers: request.headers,
    });
    
    if (calendarResponse.ok) {
      const calendarData = await calendarResponse.json();
      calendarEvents = calendarData.data || [];
    }
  } catch (error) {
    console.error('Calendar fetch error:', error);
    // Continue without calendar data
  }

  // Fetch health activity data
  let healthActivity: HealthActivity | undefined;
  try {
    const healthUrl = new URL('/api/health/activity', request.url);
    healthUrl.searchParams.set('date', new Date().toISOString().split('T')[0]);
    
    const healthResponse = await fetch(healthUrl.toString(), {
      headers: request.headers,
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      healthActivity = healthData.data;
    }
  } catch (error) {
    console.error('Health fetch error:', error);
    // Continue without health data
  }

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

  // Filter by dress code if there are calendar events
  const dressCode = getDressCodeFromEvents(calendarEvents);
  if (dressCode) {
    const dressCodeItems = filterByDressCode(availableItems, dressCode);
    // Only use dress code filtering if we have matching items
    if (dressCodeItems.length > 0) {
      availableItems = dressCodeItems;
    }
  }

  // Generate the recommendation
  const recommendation = getRecommendation(
    availableItems,
    {
      weather,
      calendar_events: calendarEvents,
      health_activity: healthActivity,
      user_preferences: userPreferences,
    },
    {
      dress_code: dressCode,
      activity_level: healthActivity?.planned_activity_level,
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
    console.error('Failed to save recommendation:', saveError);
    // Continue anyway, just log the error
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
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<OutfitRecommendation>>> {
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
