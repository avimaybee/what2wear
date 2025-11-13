import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { ApiResponse } from '@/lib/types';

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ deletedCount: number }>>> {
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
    const { itemIds } = await request.json();
    
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'itemIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Delete items (RLS policy will ensure user can only delete their own items)
    const { count, error: deleteError } = await supabase
      .from('clothing_items')
      .delete()
      .in('id', itemIds)
      .eq('user_id', user.id);

    if (deleteError) {
      logger.error('Failed to delete items:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete items' },
        { status: 500 }
      );
    }

    logger.info('Batch deleted items', {
      userId: user.id,
      itemCount: itemIds.length,
      actualDeleted: count,
    });

    return NextResponse.json({
      success: true,
      data: { deletedCount: count || 0 },
    });
  } catch (error) {
    logger.error('Error in batch delete:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
