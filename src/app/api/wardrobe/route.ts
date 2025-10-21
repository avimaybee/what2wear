import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { IClothingItem, ApiResponse } from '@/lib/types';
import { 
  validateBody, 
  withValidation, 
  createClothingItemSchema 
} from '@/lib/validation';
import { 
  withMonitoring, 
  trackDatabaseOperation,
  metricsCollector 
} from '@/lib/monitoring';

/**
 * GET /api/wardrobe
 * Task 1.2: Get all wardrobe items for the authenticated user
 * UPDATED: Recommendation #4 - Added validation middleware
 * UPDATED: Recommendation #1 - Added monitoring and performance tracking
 */
export const GET = withMonitoring(withValidation(async (_request: NextRequest): Promise<NextResponse<ApiResponse<IClothingItem[]>>> => {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Fetch all clothing items for the user with performance tracking
  const { data, error } = await trackDatabaseOperation(
    'SELECT',
    'clothing_items',
    async () => supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
  );

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  // Track wardrobe view metrics
  metricsCollector.trackWardrobeViewed(user.id, data?.length || 0);

  return NextResponse.json({
    success: true,
    data: data as IClothingItem[],
  });
}));

/**
 * POST /api/wardrobe
 * Task 1.2: Add a new clothing item to the wardrobe
 * UPDATED: Recommendation #4 - Added comprehensive validation with Zod
 * UPDATED: Recommendation #1 - Added monitoring and metrics tracking
 */
export const POST = withMonitoring(withValidation(async (request: NextRequest): Promise<NextResponse<ApiResponse<IClothingItem>>> => {
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

  // Create new clothing item with validated data including AI-enhanced properties
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
    // AI-enhanced properties for better outfit recommendations
    pattern: validatedData.pattern || null,
    fit: validatedData.fit || null,
    style: validatedData.style || null,
    occasion: validatedData.occasion || null,
    description: validatedData.description || null,
  };

  // Insert with performance tracking
  const { data, error } = await trackDatabaseOperation(
    'INSERT',
    'clothing_items',
    async () => supabase
      .from('clothing_items')
      .insert([newItem])
      .select()
      .single()
  );

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  // Track wardrobe item addition
  metricsCollector.trackWardrobeItemAdded(user.id, validatedData.type);

  return NextResponse.json({
    success: true,
    data: data as IClothingItem,
    message: 'Item added successfully',
  }, { status: 201 });
}));
