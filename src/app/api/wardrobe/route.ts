import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { IClothingItem, ApiResponse } from '@/lib/types';
import { logger } from '@/lib/logger';
import { normalizeMaterial } from '@/lib/validation';

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

  const items = data || [];

  const updatedData = await Promise.all(
    items.map(async (item) => {
      if (item.image_url) {
        try {
          const url = new URL(item.image_url);
          const pathSegments = url.pathname.split('/clothing_images/');

          if (pathSegments.length > 1 && pathSegments[1]) {
            const path = pathSegments[1];
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('clothing_images')
              .createSignedUrl(path, 60); // 60-second validity

            if (signedUrlError) {
              throw signedUrlError;
            }

            return { ...item, image_url: signedUrlData.signedUrl };
          }
        } catch (e) {
          logger.error(`Error processing image URL for item ${item.id}:`, e);
          // Return original item if URL processing fails
          return item;
        }
      }
      return item;
    })
  );

  return NextResponse.json({
      success: true,
      data: updatedData as IClothingItem[],
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
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Received wardrobe POST request with body:', JSON.stringify(body, null, 2));
    }

    // Normalize season_tags to lowercase to match database enum
    const normalizedSeasonTags = body.season_tags 
      ? body.season_tags.map((season: string) => season.toLowerCase())
      : null;

    // Normalize material to match database enum
    const normalizedMaterial = normalizeMaterial(body.material);

    // Create new clothing item
    const newItem = {
      user_id: user.id,
      name: body.name,
      type: body.type,
      category: body.category || null,
      color: body.color || null,
      material: normalizedMaterial,
      insulation_value: body.insulation_value || 5,
      image_url: body.image_url || null,
      season_tags: normalizedSeasonTags,
      style_tags: body.style_tags || null,
      dress_code: body.dress_code || ['Casual'],
      last_worn_date: null,
      pattern: body.pattern || null,
      fit: body.fit || null,
      style: body.style || null,
      occasion: body.occasion || null,
      description: body.description || null,
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating database record:', JSON.stringify(newItem, null, 2));
    }

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
