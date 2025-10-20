import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { IClothingItem, ApiResponse } from '@/lib/types';
import { 
  validateBody, 
  withValidation, 
  createClothingItemSchema 
} from '@/lib/validation';

/**
 * GET /api/wardrobe
 * Task 1.2: Get all wardrobe items for the authenticated user
 * UPDATED: Recommendation #4 - Added validation middleware
 */
export const GET = withValidation(async (_request: NextRequest): Promise<NextResponse<ApiResponse<IClothingItem[]>>> => {
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
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: data as IClothingItem[],
  });
});

/**
 * POST /api/wardrobe
 * Task 1.2: Add a new clothing item to the wardrobe
 * UPDATED: Recommendation #4 - Added comprehensive validation with Zod
 */
export const POST = withValidation(async (request: NextRequest): Promise<NextResponse<ApiResponse<IClothingItem>>> => {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Validate and sanitize request body using Zod schema
  const validatedData = await validateBody(request, createClothingItemSchema);

  // Create new clothing item with validated data
  const newItem = {
    user_id: user.id,
    name: validatedData.name,
    type: validatedData.type,
    category: validatedData.category || null,
    color: validatedData.color || null,
    material: validatedData.material,
    insulation_value: validatedData.insulation_value,
    image_url: validatedData.image_url,
    season_tags: validatedData.season_tags || null,
    style_tags: validatedData.style_tags || null,
    dress_code: validatedData.dress_code,
    last_worn_date: null,
  };

  const { data, error } = await supabase
    .from('clothing_items')
    .insert([newItem])
    .select()
    .single();

  if (error) {
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
});
