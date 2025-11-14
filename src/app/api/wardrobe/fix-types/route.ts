import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * POST /api/wardrobe/fix-types
 * Fix missing type fields in existing wardrobe items
 * This is a one-time fix for items created before the type migration
 */
export async function POST(_request: NextRequest): Promise<NextResponse> {
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
    // Fetch all items with NULL or undefined type
    const { data: items, error: fetchError } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', user.id)
      .is('type', null);

    if (fetchError) {
      throw fetchError;
    }

    if (!items || items.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No items need fixing',
        fixed: 0,
      });
    }

    // Map category to type
    const categoryToType = (category: string | null): string => {
      if (!category) return 'Top'; // default
      
      const cat = category.toLowerCase();
      
      if (['jacket', 'coat', 'hoodie', 'blazer', 'cardigan'].includes(cat)) {
        return 'Outerwear';
      } else if (['shirt', 't-shirt', 'blouse', 'sweater', 'tank', 'polo', 'top'].includes(cat)) {
        return 'Top';
      } else if (['pants', 'jeans', 'shorts', 'skirt', 'leggings', 'trousers', 'bottom'].includes(cat)) {
        return 'Bottom';
      } else if (['shoes', 'sneakers', 'boots', 'sandals', 'heels', 'loafers', 'footwear'].includes(cat)) {
        return 'Footwear';
      } else if (['accessory', 'scarf', 'belt', 'bag', 'jewelry', 'watch', 'sunglasses'].includes(cat)) {
        return 'Accessory';
      } else if (['cap', 'beanie', 'hat', 'headband', 'headwear'].includes(cat)) {
        return 'Headwear';
      }
      
      // Default to Top if no match
      return 'Top';
    };

    // Update each item
    const updates = items.map(item => {
      const inferredType = categoryToType(item.category);
      return supabase
        .from('clothing_items')
        .update({ type: inferredType })
        .eq('id', item.id)
        .eq('user_id', user.id);
    });

    const results = await Promise.all(updates);
    
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      logger.error('Some items failed to update', { errors });
    }

    const successCount = results.filter(r => !r.error).length;

    return NextResponse.json({
      success: true,
      message: `Fixed ${successCount} items`,
      fixed: successCount,
      total: items.length,
    });
  } catch (error) {
    logger.error('Error fixing item types', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fix items' 
      },
      { status: 500 }
    );
  }
}
