import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { ApiResponse, IClothingItem } from '@/lib/types';

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ updatedCount: number }>>> {
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
    const { itemIds, addTag, dressCode } = await request.json();
    
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'itemIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!addTag && !dressCode) {
      return NextResponse.json(
        { success: false, error: 'Must provide either addTag or dressCode' },
        { status: 400 }
      );
    }

    // Fetch current items to update them
    const { data: items, error: fetchError } = await supabase
      .from('clothing_items')
      .select('*')
      .in('id', itemIds)
      .eq('user_id', user.id);

    if (fetchError) {
      logger.error('Failed to fetch items:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch items' },
        { status: 500 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items found' },
        { status: 404 }
      );
    }

    // Prepare updates
    const updates = items.map((item: IClothingItem) => {
      const updatedItem = { ...item };

      // Add tag if provided
      if (addTag) {
        const tags = item.style_tags || [];
        if (!tags.includes(addTag)) {
          updatedItem.style_tags = [...tags, addTag];
        }
      }

      // Set dress code if provided
      if (dressCode) {
        updatedItem.dress_code = [dressCode];
      }

      return updatedItem;
    });

    // Update items in batch
    const { error: updateError, count } = await supabase
      .from('clothing_items')
      .upsert(updates);

    if (updateError) {
      logger.error('Failed to update items:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update items' },
        { status: 500 }
      );
    }

    logger.info('Batch updated items', {
      userId: user.id,
      itemCount: itemIds.length,
      updateType: addTag ? 'addTag' : 'dressCode',
    });

    return NextResponse.json({
      success: true,
      data: { updatedCount: count || items.length },
    });
  } catch (error) {
    logger.error('Error in batch update:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
