import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { HealthActivity, ApiResponse } from '@/lib/types';

/**
 * GET /api/health/activity
 * Task 2.3: Fetch health/activity data
 * 
 * Note: This is a placeholder implementation. Full integration with
 * Apple Health or Fitbit requires proper OAuth and API setup.
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<HealthActivity>>> {
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
    const provider = searchParams.get('provider') || 'mock';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // For now, return mock data
    // TODO: Implement actual health API integration
    if (provider === 'fitbit' || provider === 'appleHealth') {
      // This would require:
      // 1. User OAuth flow to get access token
      // 2. Store tokens in Supabase
      // 3. Fetch activity data using respective API
      return NextResponse.json({
        success: false,
        error: `${provider} integration not yet implemented. Use provider=mock for testing.`,
      }, { status: 501 });
    }

    // Mock health activity data for testing
    // This could be based on time of day or randomized
    const hour = new Date().getHours();
    let plannedActivityLevel: 'Low' | 'Medium' | 'High';
    
    if (hour < 8) {
      plannedActivityLevel = 'Low'; // Early morning
    } else if (hour >= 8 && hour < 17) {
      plannedActivityLevel = 'Medium'; // During work hours
    } else if (hour >= 17 && hour < 20) {
      plannedActivityLevel = 'High'; // Evening workout time
    } else {
      plannedActivityLevel = 'Low'; // Late evening
    }

    const mockActivity: HealthActivity = {
      date: new Date(date),
      planned_activity_level: plannedActivityLevel,
      steps: Math.floor(Math.random() * 5000) + 5000, // Mock: 5000-10000 steps
      active_minutes: Math.floor(Math.random() * 60) + 30, // Mock: 30-90 active minutes
    };

    return NextResponse.json({
      success: true,
      data: mockActivity,
      message: 'Using mock health activity data. Planned activity level based on current time.',
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
