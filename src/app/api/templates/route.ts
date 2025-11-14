/**
 * API Route: Get available outfit templates
 * Returns all outfit templates that can be created from user's wardrobe
 * Endpoint: GET /api/templates
 * Query: ?templateId=casual-basic (optional, get specific template)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { IClothingItem } from '@/lib/types';
import { 
  detectAvailableTemplates, 
  getTemplate, 
  getAllTemplates,
} from '@/lib/helpers/outfitTemplates';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user wants a specific template
    const templateId = req.nextUrl.searchParams.get('templateId');
    
    if (templateId) {
      // Return specific template
      const template = getTemplate(templateId);
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: template,
      });
    }

    // Fetch user's wardrobe
    const { data: wardrobe, error: wardrobeError } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', user.id);

    if (wardrobeError) {
      logger.error('Error fetching wardrobe for template detection', { error: wardrobeError });
      return NextResponse.json(
        { error: 'Failed to fetch wardrobe' },
        { status: 500 }
      );
    }

    // Detect available templates
    const wardrobeItems = (wardrobe as IClothingItem[]) || [];
    const availableTemplates = detectAvailableTemplates(wardrobeItems);
    const allTemplates = getAllTemplates();

    // Map templates with availability status
    const templatesWithStatus = allTemplates.map(template => ({
      ...template,
      isAvailable: availableTemplates.some(t => t.id === template.id),
    }));

    logger.info(`Detected ${availableTemplates.length} available templates for user ${user.id}`);

    return NextResponse.json({
      success: true,
      data: {
        templates: templatesWithStatus,
        available: availableTemplates,
        totalWardrobeItems: wardrobeItems.length,
        itemTypeBreakdown: {
          tops: wardrobeItems.filter((i: IClothingItem) => i.type === 'Top').length,
          bottoms: wardrobeItems.filter((i: IClothingItem) => i.type === 'Bottom').length,
          footwear: wardrobeItems.filter((i: IClothingItem) => i.type === 'Footwear').length,
          outerwear: wardrobeItems.filter((i: IClothingItem) => i.type === 'Outerwear').length,
          accessories: wardrobeItems.filter((i: IClothingItem) => i.type === 'Accessory').length,
          headwear: wardrobeItems.filter((i: IClothingItem) => i.type === 'Headwear').length,
        },
      },
    });
  } catch (error) {
    logger.error('Error in template detection endpoint', { error });
    return NextResponse.json(
      { error: 'Failed to detect templates' },
      { status: 500 }
    );
  }
}
