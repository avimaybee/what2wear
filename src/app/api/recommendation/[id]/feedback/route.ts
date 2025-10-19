import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RecommendationFeedback, ApiResponse } from '@/lib/types';
import { adjustPreferencesBasedOnFeedback } from '@/lib/helpers/preferenceLearning';

/**
 * POST /api/recommendation/[id]/feedback
 * Submit feedback for a recommendation and update user preferences
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

    // Verify recommendation exists and belongs to user
    const { data: recommendation, error: recError } = await supabase
      .from('outfit_recommendations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (recError || !recommendation) {
      return NextResponse.json(
        { success: false, error: 'Recommendation not found' },
        { status: 404 }
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
    const { error: insertError } = await supabase
      .from('recommendation_feedback')
      .insert([{
        user_id: user.id,
        recommendation_id: feedback.recommendation_id,
        is_liked: feedback.is_liked,
        reason: feedback.reason,
      }])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    // Get clothing items from the recommendation
    const { data: items } = await supabase
      .from('clothing_items')
      .select('*')
      .in('id', recommendation.outfit_items);

    // Update user preferences based on feedback
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      const currentPreferences = profile?.preferences || {};
      const updatedPreferences = adjustPreferencesBasedOnFeedback(
        currentPreferences,
        items || [],
        body.is_liked
      );

      // Save updated preferences
      await supabase
        .from('profiles')
        .update({ preferences: updatedPreferences })
        .eq('id', user.id);
    } catch (prefError) {
      console.error('Failed to update preferences:', prefError);
      // Don't fail the request if preference update fails
    }

    return NextResponse.json({
      success: true,
      data: feedback,
      message: 'Feedback recorded successfully. Your preferences have been updated.',
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
