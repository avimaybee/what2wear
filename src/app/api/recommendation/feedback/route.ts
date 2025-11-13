/**
 * POST /api/recommendation/feedback
 * 
 * Handles user feedback on outfit recommendations.
 * Learns from likes/dislikes to improve future recommendations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processFeedback } from '@/lib/helpers/feedbackProcessor';
import { logger } from '@/lib/logger';
import type { ApiResponse } from '@/lib/types';

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ success: boolean }>>> {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request
    const body = await request.json();
    const { recommendationId, isLiked, reason, outfitItems, weather } = body;

    // Validate required fields
    if (!recommendationId || typeof isLiked !== 'boolean' || !Array.isArray(outfitItems)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Process feedback
    const result = await processFeedback({
      userId: user.id,
      recommendationId,
      isLiked,
      reason,
      outfitItems,
      weather,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    logger.info('Feedback logged and processed', {
      userId: user.id,
      isLiked,
      recommendationId,
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded and analyzed',
    });
  } catch (error) {
    logger.error('Error processing feedback:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recommendation/feedback
 * 
 * Gets user's feedback history (optional - for analytics)
 */
export async function GET(
  _request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch feedback history
    const { data, error } = await supabase
      .from('recommendation_feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      message: 'Feedback history retrieved',
    });
  } catch (error) {
    logger.error('Error fetching feedback:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
