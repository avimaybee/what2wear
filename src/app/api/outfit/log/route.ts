import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponse } from '@/lib/types';

/**
 * POST /api/outfit/log
 * Log outfit usage, create outfit record, and update last_worn_date for all items
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ outfit_id: number; updated_count: number }>>> {
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
    const outfitDate = body.outfit_date || new Date().toISOString().split('T')[0];
    const feedback = body.feedback || null;

    // Log for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('Log outfit request:', {
        userId: user.id,
        itemIds,
        outfitDate,
        feedback,
      });
    }

    // Create outfit record
    const { data: outfit, error: outfitError } = await supabase
      .from('outfits')
      .insert({
        user_id: user.id,
        outfit_date: outfitDate,
        feedback,
      })
      .select()
      .single();

    if (outfitError || !outfit) {
      console.error('Error creating outfit:', outfitError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create outfit record',
          details: process.env.NODE_ENV !== 'production' ? outfitError?.message : undefined
        },
        { status: 500 }
      );
    }

    // Create outfit_items relationships
    const outfitItems = itemIds.map(itemId => ({
      outfit_id: outfit.id,
      clothing_item_id: itemId,
    }));

    const { error: itemsError } = await supabase
      .from('outfit_items')
      .insert(outfitItems);

    if (itemsError) {
      console.error('Error inserting outfit items:', itemsError);
      // Rollback: delete the outfit if items couldn't be linked
      await supabase.from('outfits').delete().eq('id', outfit.id);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to link items to outfit',
          details: process.env.NODE_ENV !== 'production' ? itemsError?.message : undefined
        },
        { status: 500 }
      );
    }

    // Update last_worn and wear_count for all items in the outfit
    const { data: updatedItems, error: updateError } = await supabase
      .from('clothing_items')
      .update({ last_worn: outfitDate })
      .in('id', itemIds)
      .eq('user_id', user.id)
      .select('id');

    if (updateError) {
      console.error('Error updating last_worn:', updateError);
      // Don't fail the request, just log the error
    }

    const updatedCount = updatedItems?.length || 0;

    return NextResponse.json({
      success: true,
      data: { 
        outfit_id: outfit.id,
        updated_count: updatedCount 
      },
      message: `Successfully logged outfit with ${itemIds.length} items`,
    });
  } catch (error) {
    console.error('Unexpected error logging outfit:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV !== 'production' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
