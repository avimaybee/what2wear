'use server'

import { createClient } from '@/lib/supabase/server'
import type { Outfit } from '@/lib/types'

const OUTFITS_PER_PAGE = 10;

export async function getOutfitHistory(page: number = 1): Promise<{ outfits: Outfit[] | null, error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { outfits: null, error: 'You must be logged in to view your history.' };
  }

  const from = (page - 1) * OUTFITS_PER_PAGE;
  const to = from + OUTFITS_PER_PAGE - 1;

  const { data, error } = await supabase
    .from('outfits')
    .select(`
      id,
      created_at,
      feedback,
      outfit_items!inner(
        clothing_items!inner(
          id,
          image_url,
          category
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching outfit history:', error);
    return { outfits: null, error: 'Failed to fetch outfit history.' };
  }

  // Define a local type for the item structure returned by Supabase before transformation
  type SupabaseOutfitItem = {
    clothing_items: {
      id: number;
      image_url: string;
      category: string | null;
    }[]; // Supabase returns clothing_items as an array here
  };

  // Transform the data to match the Outfit type
  const transformedOutfits: Outfit[] = data.map(outfit => ({
    id: outfit.id,
    created_at: outfit.created_at,
    feedback: outfit.feedback,
    outfit_items: outfit.outfit_items.map((item: SupabaseOutfitItem) => ({
      clothing_items: item.clothing_items[0], // Assuming clothing_items is always an array with one item
    })),
  }));

  return { outfits: transformedOutfits, error: null };
}