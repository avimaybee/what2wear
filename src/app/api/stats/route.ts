/**
 * User Statistics API Endpoint
 * GET /api/stats
 * 
 * Returns basic usage statistics for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get basic statistics from database
    const { data: outfitLogs, error: logsError } = await supabase
      .from('outfit_logs')
      .select('id')
      .eq('user_id', user.id);
    
    const { data: wardrobeItems, error: wardrobeError } = await supabase
      .from('clothing_items')
      .select('id')
      .eq('user_id', user.id);

    const stats = {
      totalOutfits: logsError ? 0 : (outfitLogs?.length || 0),
      wardrobeSize: wardrobeError ? 0 : (wardrobeItems?.length || 0),
    };
    
    return NextResponse.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    logger.error('Error fetching user stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
