import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { IClothingItem, ApiResponse } from '@/lib/types';
import { logger } from '@/lib/logger';

/**
 * PUT /api/wardrobe/[id]/favorite
 * Toggle the favorite status of a clothing item
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
): Promise<NextResponse<ApiResponse<IClothingItem>>> {
  const supabase = await createClient();
  const resolvedParams = await context.params;
  const { id } = resolvedParams;

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { is_favorite } = await request.json();

    // Update the item
    const { data, error } = await supabase
      .from('clothing_items')
      .update({ is_favorite })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating favorite status:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as IClothingItem,
      message: 'Favorite status updated successfully',
    });
  } catch (error) {
    logger.error('Error processing PUT request:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request data' },
      { status: 400 }
    );
  }
}
