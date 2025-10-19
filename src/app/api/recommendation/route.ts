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

/**
 * POST /api/recommendation
 * Generate outfit recommendation based on weather, calendar, and user preferences
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<OutfitRecommendation>>> {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { lat, lon, date, occasion } = body;

    if (!lat || !lon) {
      return NextResponse.json(
        { success: false, error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Fetch user's wardrobe
    const { data: wardrobeItems, error: wardrobeError } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', user.id);

    if (wardrobeError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch wardrobe items' },
        { status: 500 }
      );
    }

    if (!wardrobeItems || wardrobeItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No clothing items found in wardrobe' },
        { status: 404 }
      );
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
      return NextResponse.json(
        { success: false, error: 'Failed to fetch weather data' },
        { status: 500 }
      );
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
      healthUrl.searchParams.set('date', date || new Date().toISOString().split('T')[0]);
      
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
      .eq('id', user.id)
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
        user_id: user.id,
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

    return NextResponse.json({
      success: true,
      data: {
        ...recommendation,
        id: savedRecommendation?.id,
      },
    });
  } catch (error) {
    console.error('Recommendation generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recommendation
 * Get latest recommendation for the user
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<OutfitRecommendation>>> {
  try {
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
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
