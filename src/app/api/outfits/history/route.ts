/**
 * Outfit History API Endpoint
 * GET /api/outfits/history
 * 
 * Returns paginated outfit history with filtering and search capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface OutfitHistoryItem {
  id: number;
  outfit_date: string;
  rendered_image_url: string | null;
  feedback: number | null;
  created_at: string;
  weather_data?: Record<string, unknown>;
  items: Array<{
    id: number;
    name: string;
    type: string;
    image_url: string;
    color: string;
    category: string;
  }>;
}

export async function GET(request: NextRequest) {
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
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const season = searchParams.get('season');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minFeedback = searchParams.get('minFeedback');
    
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('outfits')
      .select(`
        id,
        outfit_date,
        rendered_image_url,
        feedback,
        created_at,
        weather_data,
        outfit_items (
          clothing_items (
            id,
            name,
            type,
            image_url,
            color,
            category
          )
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('outfit_date', { ascending: false });
    
    // Apply filters
    if (startDate) {
      query = query.gte('outfit_date', startDate);
    }
    if (endDate) {
      query = query.lte('outfit_date', endDate);
    }
    if (minFeedback) {
      query = query.gte('feedback', parseInt(minFeedback));
    }
    
    // Execute query with pagination
    const { data: outfits, error: queryError, count } = await query
      .range(offset, offset + limit - 1);
    
    if (queryError) {
      console.error('Error fetching outfit history:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch outfit history' },
        { status: 500 }
      );
    }
    
    // Transform data - outfit_items is an array of objects with clothing_items property
    const history: OutfitHistoryItem[] = (outfits || []).map(outfit => ({
      id: outfit.id,
      outfit_date: outfit.outfit_date,
      rendered_image_url: outfit.rendered_image_url,
      feedback: outfit.feedback,
      created_at: outfit.created_at,
      weather_data: outfit.weather_data,
      items: (outfit.outfit_items || [])
        .map(outfitItem => outfitItem.clothing_items)
        .flat()
        .filter((item): item is OutfitHistoryItem['items'][0] => Boolean(item))
    }));

    const signedUrlCache = new Map<string, string>();
    const SIGNED_URL_TTL = 60 * 60;
    const getSafeImageUrl = async (imageUrl: string | null): Promise<string | null> => {
      if (!imageUrl) return null;
      if (imageUrl.startsWith('data:')) return imageUrl;
      if (imageUrl.includes('/storage/v1/object/public/')) return imageUrl;
      if (signedUrlCache.has(imageUrl)) {
        return signedUrlCache.get(imageUrl)!;
      }

      let objectPath: string | null = null;
      if (imageUrl.startsWith('http')) {
        try {
          const parsed = new URL(imageUrl);
          const parts = parsed.pathname.split('/clothing_images/');
          if (parts.length > 1 && parts[1]) {
            objectPath = parts[1];
          }
        } catch (_error) {
          // ignore parsing error and fall back to original URL
        }
      } else {
        objectPath = imageUrl.replace(/^clothing_images\//, '');
      }

      if (!objectPath) {
        return imageUrl;
      }

      const { data: signed, error } = await supabase.storage
        .from('clothing_images')
        .createSignedUrl(objectPath, SIGNED_URL_TTL);

      if (!error && signed?.signedUrl) {
        signedUrlCache.set(imageUrl, signed.signedUrl);
        return signed.signedUrl;
      }

      return imageUrl;
    };

    const historyWithImages: OutfitHistoryItem[] = await Promise.all(
      history.map(async (outfit) => ({
        ...outfit,
        items: await Promise.all(outfit.items.map(async (item) => ({
          ...item,
          image_url: (await getSafeImageUrl(item.image_url)) || item.image_url,
        }))),
      }))
    );
    
    // Apply season filter (client-side since season is stored in items)
    let filteredHistory = historyWithImages;
    if (season) {
      filteredHistory = history.filter(outfit => 
        outfit.items.some(item => 
          item.category?.toLowerCase().includes(season.toLowerCase())
        )
      );
    }
    
    // Apply search filter (search by item name, type, color)
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filteredHistory = filteredHistory.filter(outfit =>
        outfit.items.some(item =>
          item.name?.toLowerCase().includes(searchLower) ||
          item.type?.toLowerCase().includes(searchLower) ||
          item.color?.toLowerCase().includes(searchLower) ||
          item.category?.toLowerCase().includes(searchLower)
        )
      );
    }
    
    // Calculate pagination info
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;
    
    return NextResponse.json({
      success: true,
      data: filteredHistory,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
      }
    });
    
  } catch (error) {
    console.error('Error in outfit history API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
