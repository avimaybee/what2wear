import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RecommendationFeedback, ApiResponse } from '@/lib/types';

/**
 * POST /api/recommendation/[id]/feedback
 * Task 4.1: User Feedback Model - Log user feedback on recommendations
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<RecommendationFeedback>>> {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
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
    
    // Validate required fields
    if (typeof body.is_liked !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'is_liked (boolean) is required' },
        { status: 400 }
      );
    }

    // Create feedback record
    const feedback: RecommendationFeedback = {
      recommendation_id: id,
      is_liked: body.is_liked,
      reason: body.reason || undefined,
      weather_conditions: body.weather_conditions || undefined,
      created_at: new Date(),
    };

    // Store feedback in database
    // Note: This requires a 'recommendation_feedback' table in Supabase
    const { error } = await supabase
      .from('recommendation_feedback')
      .insert([{
        user_id: user.id,
        recommendation_id: feedback.recommendation_id,
        is_liked: feedback.is_liked,
        reason: feedback.reason,
        weather_conditions: feedback.weather_conditions,
      }])
      .select()
      .single();

    if (error) {
      // If table doesn't exist, log to console for now
      if (error.code === '42P01') {
        console.log('Feedback logged (table not created yet):', feedback);
        return NextResponse.json({
          success: true,
          data: feedback,
          message: 'Feedback logged (recommendation_feedback table will be created in database setup)',
        });
      }
      
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: feedback,
      message: 'Feedback recorded successfully',
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
