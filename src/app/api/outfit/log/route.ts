import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponse } from '@/lib/types';

/**
 * POST /api/outfit/log
 * Task 1.3: Log outfit usage and update last_worn_date for all items
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ updated_count: number }>>> {
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
    
    // Validate required fields
    if (!body.item_ids || !Array.isArray(body.item_ids) || body.item_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'item_ids array is required and must not be empty' },
        { status: 400 }
      );
    }

    const itemIds = body.item_ids as number[];
    const currentDate = new Date().toISOString();

    // Update last_worn_date for all items in the outfit
    const { data, error } = await supabase
      .from('clothing_items')
      .update({ last_worn_date: currentDate })
      .in('id', itemIds)
      .eq('user_id', user.id)
      .select('id');

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Verify all items were updated
    const updatedCount = data?.length || 0;
    if (updatedCount !== itemIds.length) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Only ${updatedCount} of ${itemIds.length} items were updated. Some items may not exist or don't belong to you.` 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { updated_count: updatedCount },
      message: `Successfully logged outfit usage for ${updatedCount} items`,
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
