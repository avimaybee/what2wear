import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateOutfitRecommendations } from '@/lib/genkit';

// Simplified outfit recommendation - Blueprint aligned using Genkit
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { date, occasion, weather } = body;
    const outfitDate = date || new Date().toISOString().split('T')[0];

    // Get user preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('style_preferences, gender, region')
      .eq('id', user.id)
      .single();

    const stylePrefs = profile?.style_preferences || {
      preferred_styles: [],
      disliked_items: [],
      dress_codes: [],
      cooldown_days: 3,
    };

    // Get wardrobe items
    const { data: items, error: itemsError } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', user.id);

    if (itemsError) throw itemsError;
    
    if (!items || items.length < 3) {
      return NextResponse.json({
        success: false,
        needsWardrobe: true,
        message: 'You need at least 3 items in your wardrobe to generate outfits.',
      });
    }

    // Filter out disliked items and apply cooldown
    const cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() - stylePrefs.cooldown_days);
    
    const availableItems = items.filter(item => {
      // Skip disliked items
      if (stylePrefs.disliked_items?.includes(item.id)) return false;
      
      // Apply cooldown
      if (item.last_worn) {
        const lastWorn = new Date(item.last_worn);
        if (lastWorn > cooldownDate) return false;
      }
      
      return true;
    });

    if (availableItems.length < 3) {
      return NextResponse.json({
        success: false,
        message: 'Not enough items available (some are in cooldown or disliked).',
      });
    }

    // Get weather data if not provided
    let weatherData = weather;
    if (!weatherData && profile?.region) {
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${profile.region}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`
      );
      if (weatherRes.ok) {
        const data = await weatherRes.json();
        weatherData = {
          temperature: data.main.temp,
          condition: data.weather[0].main,
          humidity: data.main.humidity,
          location: profile.region,
          forecast_time: new Date().toISOString(),
        };
      }
    }

    // Generate outfit recommendations using Genkit + gemini-2.5-flash-lite
    const aiResponse = await generateOutfitRecommendations({
      items: availableItems.slice(0, 20).map(i => ({
        id: i.id,
        category: i.category,
        color: i.color,
        style_tags: i.style_tags,
        season_tags: i.season_tags,
      })),
      weather: weatherData,
      occasion: occasion || 'daily wear',
      preferences: stylePrefs,
      gender: profile?.gender || 'neutral',
    });
    
    if (!aiResponse.outfits || aiResponse.outfits.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Could not generate outfit recommendations. Try adding more items.',
      });
    }
    
    // Take the first outfit recommendation
    const selectedOutfit = aiResponse.outfits[0];
    
    // Create outfit record
    const { data: outfit, error: outfitError } = await supabase
      .from('outfits')
      .insert({
        user_id: user.id,
        outfit_date: outfitDate,
        reasoning: selectedOutfit.reasoning,
        weather_data: weatherData,
      })
      .select()
      .single();

    if (outfitError) throw outfitError;

    // Create outfit_items records
    const outfitItems = selectedOutfit.items.map((itemId: number) => ({
      outfit_id: outfit.id,
      clothing_item_id: itemId,
    }));

    const { error: itemsInsertError } = await supabase
      .from('outfit_items')
      .insert(outfitItems);

    if (itemsInsertError) throw itemsInsertError;

    // Update wear counts
    for (const itemId of selectedOutfit.items) {
      await supabase.rpc('increment_wear_count', { item_id: itemId });
    }

    // Fetch complete outfit with items
    const { data: completeOutfit } = await supabase
      .from('outfits')
      .select(`
        *,
        outfit_items (
          clothing_item:clothing_items (*)
        )
      `)
      .eq('id', outfit.id)
      .single();

    return NextResponse.json({
      success: true,
      data: completeOutfit,
      message: '✨ Outfit generated successfully!',
    });

  } catch (error) {
    console.error('Outfit recommendation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate outfit'
      },
      { status: 500 }
    );
  }
}

// Get existing outfit
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const { data: outfit, error } = await supabase
      .from('outfits')
      .select(`
        *,
        outfit_items (
          clothing_item:clothing_items (*)
        )
      `)
      .eq('user_id', user.id)
      .eq('outfit_date', date)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json({
      success: true,
      data: outfit,
    });

  } catch (error) {
    console.error('Get outfit error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get outfit' },
      { status: 500 }
    );
  }
}
