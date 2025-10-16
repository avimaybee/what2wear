import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WeatherData, WeatherAlert, ApiResponse } from '@/lib/types';
import { config } from '@/lib/config';

/**
 * Calculate apparent temperature (feels-like) using heat index and wind chill
 * Task 3.2: Wind Chill/Heat Index Logic
 */
function calculateFeelsLike(
  temp: number,
  humidity: number,
  windSpeed: number
): number {
  // Use heat index for temperatures above 80°F (27°C)
  if (temp >= 27) {
    // Simplified heat index formula
    const hi = -8.78469475556 +
               1.61139411 * temp +
               2.33854883889 * humidity +
               -0.14611605 * temp * humidity +
               -0.012308094 * temp * temp +
               -0.0164248277778 * humidity * humidity +
               0.002211732 * temp * temp * humidity +
               0.00072546 * temp * humidity * humidity +
               -0.000003582 * temp * temp * humidity * humidity;
    return Math.round(hi * 10) / 10;
  }
  
  // Use wind chill for temperatures below 50°F (10°C)
  if (temp <= 10 && windSpeed > 3) {
    // Wind chill formula (metric)
    const wc = 13.12 + 0.6215 * temp - 11.37 * Math.pow(windSpeed, 0.16) + 
               0.3965 * temp * Math.pow(windSpeed, 0.16);
    return Math.round(wc * 10) / 10;
  }
  
  // For moderate temperatures, return actual temperature
  return temp;
}

/**
 * Generate weather alerts based on environmental conditions
 * Task 3.3: AQI/Pollen/UV checks
 */
function generateWeatherAlerts(weather: WeatherData): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  
  // UV Index check
  if (weather.uv_index >= config.app.alerts.uvIndex.veryHigh) {
    alerts.push({
      type: 'UV',
      severity: 'high',
      message: 'Very high UV index detected',
      recommendation: 'Wear a brimmed hat and sunglasses. Consider sunscreen.',
    });
  } else if (weather.uv_index >= config.app.alerts.uvIndex.high) {
    alerts.push({
      type: 'UV',
      severity: 'moderate',
      message: 'High UV index detected',
      recommendation: 'Consider wearing a hat or sunglasses for extended outdoor exposure.',
    });
  }
  
  // AQI check
  if (weather.air_quality_index >= config.app.alerts.aqi.veryUnhealthy) {
    alerts.push({
      type: 'AQI',
      severity: 'high',
      message: 'Very unhealthy air quality',
      recommendation: 'Wear outerwear with a hood or a light scarf to minimize exposure.',
    });
  } else if (weather.air_quality_index >= config.app.alerts.aqi.unhealthy) {
    alerts.push({
      type: 'AQI',
      severity: 'moderate',
      message: 'Unhealthy air quality for sensitive groups',
      recommendation: 'Consider covering up if you have respiratory sensitivities.',
    });
  }
  
  // Pollen check
  if (weather.pollen_count >= config.app.alerts.pollen.veryHigh) {
    alerts.push({
      type: 'Pollen',
      severity: 'high',
      message: 'Very high pollen count',
      recommendation: 'Wear outerwear with a hood or consider a face covering if you have allergies.',
    });
  } else if (weather.pollen_count >= config.app.alerts.pollen.high) {
    alerts.push({
      type: 'Pollen',
      severity: 'moderate',
      message: 'High pollen count',
      recommendation: 'Be aware if you have pollen allergies.',
    });
  }
  
  return alerts;
}

/**
 * GET /api/weather
 * Task 3.1: Hyper-local weather API with UV, Pollen, AQI
 * Task 3.2: Includes feels-like temperature calculation
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<{ weather: WeatherData; alerts: WeatherAlert[] }>>> {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const provider = searchParams.get('provider') || 'mock';

    if (!lat || !lon) {
      return NextResponse.json(
        { success: false, error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // For now, return mock data
    // TODO: Implement actual weather API integration
    if (provider === 'tomorrowIo' || provider === 'openWeather') {
      // This would require:
      // 1. Make API call to weather service
      // 2. Parse response
      // 3. Calculate feels-like temperature
      // 4. Generate alerts
      return NextResponse.json({
        success: false,
        error: `${provider} integration not yet implemented. Use provider=mock for testing.`,
      }, { status: 501 });
    }

    // Mock weather data for testing
    const temperature = 20 + Math.random() * 10; // 20-30°C
    const humidity = 40 + Math.random() * 40; // 40-80%
    const windSpeed = 5 + Math.random() * 15; // 5-20 km/h
    
    const mockWeather: WeatherData = {
      temperature: Math.round(temperature * 10) / 10,
      feels_like: calculateFeelsLike(temperature, humidity, windSpeed),
      humidity: Math.round(humidity),
      wind_speed: Math.round(windSpeed * 10) / 10,
      uv_index: Math.floor(Math.random() * 12), // 0-11
      air_quality_index: Math.floor(Math.random() * 200), // 0-200
      pollen_count: Math.random() * 12, // 0-12
      weather_condition: 'Partly Cloudy',
      timestamp: new Date(),
    };

    // Generate alerts based on weather conditions
    const alerts = generateWeatherAlerts(mockWeather);

    return NextResponse.json({
      success: true,
      data: {
        weather: mockWeather,
        alerts,
      },
      message: 'Using mock weather data.',
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
