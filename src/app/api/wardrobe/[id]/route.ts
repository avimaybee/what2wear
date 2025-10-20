import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { IClothingItem, ApiResponse } from '@/lib/types';
import { 
  validateBody, 
  validateParams,
  withValidation, 
  updateClothingItemSchema,
  clothingItemIdSchema
} from '@/lib/validation';

/**
 * GET /api/wardrobe/[id]
 * Task 1.2: Get a specific clothing item
 * UPDATED: Recommendation #4 - Added parameter validation
 */
export const GET = withValidation(async (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
): Promise<NextResponse<ApiResponse<IClothingItem>>> => {
  const supabase = await createClient();
  
  if (!context?.params) {
    return NextResponse.json(
      { success: false, error: 'Missing parameters' },
      { status: 400 }
    );
  }
  
  const resolvedParams = await context.params;
  
  // Validate route parameters
  const { id } = validateParams(resolvedParams, clothingItemIdSchema);
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Fetch the specific clothing item
  const { data, error } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: data as IClothingItem,
  });
});

/**
 * PUT /api/wardrobe/[id]
 * Task 1.2: Update a clothing item
 * UPDATED: Recommendation #4 - Added comprehensive validation and sanitization
 */
export const PUT = withValidation(async (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
): Promise<NextResponse<ApiResponse<IClothingItem>>> => {
  const supabase = await createClient();
  
  if (!context?.params) {
    return NextResponse.json(
      { success: false, error: 'Missing parameters' },
      { status: 400 }
    );
  }
  
  const resolvedParams = await context.params;
  
  // Validate route parameters
  const { id } = validateParams(resolvedParams, clothingItemIdSchema);
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Validate and sanitize request body
  const validatedData = await validateBody(request, updateClothingItemSchema);
  
  // Build update object (only include provided fields)
  const updates: Partial<IClothingItem> = {};
  
  if (validatedData.name !== undefined) updates.name = validatedData.name;
  if (validatedData.type !== undefined) updates.type = validatedData.type;
  if (validatedData.category !== undefined) updates.category = validatedData.category;
  if (validatedData.color !== undefined) updates.color = validatedData.color;
  if (validatedData.material !== undefined) updates.material = validatedData.material;
  if (validatedData.insulation_value !== undefined) updates.insulation_value = validatedData.insulation_value;
  if (validatedData.season_tags !== undefined) updates.season_tags = validatedData.season_tags;
  if (validatedData.style_tags !== undefined) updates.style_tags = validatedData.style_tags;
  if (validatedData.dress_code !== undefined) updates.dress_code = validatedData.dress_code;
  if (validatedData.image_url !== undefined) updates.image_url = validatedData.image_url;

  // Update the item
  const { data, error } = await supabase
    .from('clothing_items')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
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
    message: 'Item updated successfully',
  });
});

/**
 * DELETE /api/wardrobe/[id]
 * Task 1.2: Delete a clothing item
 * UPDATED: Recommendation #4 - Added parameter validation
 */
export const DELETE = withValidation(async (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
): Promise<NextResponse<ApiResponse<null>>> => {
  const supabase = await createClient();
  
  if (!context?.params) {
    return NextResponse.json(
      { success: false, error: 'Missing parameters' },
      { status: 400 }
    );
  }
  
  const resolvedParams = await context.params;
  
  // Validate route parameters
  const { id } = validateParams(resolvedParams, clothingItemIdSchema);
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Delete the item
  const { error } = await supabase
    .from('clothing_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Item deleted successfully',
  });
});
