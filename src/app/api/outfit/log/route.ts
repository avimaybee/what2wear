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
    const currentDate = new Date().toISOString();

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
      return NextResponse.json(
        { success: false, error: 'Failed to create outfit record' },
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
      // Rollback: delete the outfit if items couldn't be linked
      await supabase.from('outfits').delete().eq('id', outfit.id);
      return NextResponse.json(
        { success: false, error: 'Failed to link items to outfit' },
        { status: 500 }
      );
    }

    // Update last_worn_date for all items in the outfit
    const { data: updatedItems, error: updateError } = await supabase
      .from('clothing_items')
      .update({ last_worn_date: currentDate })
      .in('id', itemIds)
      .eq('user_id', user.id)
      .select('id');

    if (updateError) {
      console.error('Error updating last_worn_date:', updateError);
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
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
