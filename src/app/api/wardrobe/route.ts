import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { IClothingItem, ApiResponse } from '@/lib/types';
import { logger } from '@/lib/logger';

/**
 * GET /api/wardrobe
 * Get all wardrobe items for the authenticated user
 */
export async function GET(_request: NextRequest): Promise<NextResponse<ApiResponse<IClothingItem[]>>> {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Fetch all clothing items for the user
  const { data, error } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching wardrobe items:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: data as IClothingItem[],
  });
}

/**
 * POST /api/wardrobe
 * Add a new clothing item to the wardrobe
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<IClothingItem>>> {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // Create new clothing item
    const newItem = {
      user_id: user.id,
      name: body.name,
      type: body.type,
      category: body.category || null,
      color: body.color || null,
      material: body.material || null,
      insulation_value: body.insulation_value || 5,
      image_url: body.image_url || null,
      season_tags: body.season_tags || null,
      style_tags: body.style_tags || null,
      dress_code: body.dress_code || 'casual',
      last_worn_date: null,
      pattern: body.pattern || null,
      fit: body.fit || null,
      style: body.style || null,
      occasion: body.occasion || null,
      description: body.description || null,
    };

    const { data, error } = await supabase
      .from('clothing_items')
      .insert([newItem])
      .select()
      .single();

    if (error) {
      logger.error('Error creating wardrobe item:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as IClothingItem,
      message: 'Item added successfully',
    }, { status: 201 });
  } catch (error) {
    logger.error('Error processing wardrobe POST:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request data' },
      { status: 400 }
    );
  }
}
