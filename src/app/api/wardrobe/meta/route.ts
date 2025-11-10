import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponse } from '@/lib/types';
import { logger } from '@/lib/logger';

interface WardrobeMeta {
  styles: string[];
  colors: string[];
  materials: string[];
}

/**
 * GET /api/wardrobe/meta
 * Get metadata about the user's wardrobe (unique styles, colors, materials).
 */
export async function GET(_request: NextRequest): Promise<NextResponse<ApiResponse<WardrobeMeta>>> {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch all clothing items for the user, selecting only the relevant columns
  const { data, error } = await supabase
    .from('clothing_items')
    .select('style_tags, color, material')
    .eq('user_id', user.id);

  if (error) {
    logger.error('Error fetching wardrobe items for metadata:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const styleSet = new Set<string>();
  const colorSet = new Set<string>();
  const materialSet = new Set<string>();

  if (data) {
    for (const item of data) {
      // Add style tags
      if (item.style_tags) {
        for (const tag of item.style_tags) {
          styleSet.add(tag);
        }
      }
      // Add color
      if (item.color) {
        colorSet.add(item.color);
      }
      // Add material
      if (item.material) {
        materialSet.add(item.material);
      }
    }
  }

  return NextResponse.json({
      success: true,
      data: {
        styles: Array.from(styleSet).sort(),
        colors: Array.from(colorSet).sort(),
        materials: Array.from(materialSet).sort(),
      },
  });
}
