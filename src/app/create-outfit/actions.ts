'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveManualOutfit(name: string, itemIds: string[]) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be logged in to create an outfit.' };
  }

  // 1. Create the outfit record
  const { data: outfitData, error: outfitError } = await supabase
    .from('outfits')
    .insert({ user_id: user.id, outfit_date: new Date().toISOString(), name: name })
    .select('id')
    .single();

  if (outfitError) {
    console.error('Error creating outfit:', outfitError);
    return { error: 'Failed to create outfit.' };
  }

  const outfitId = outfitData.id;

  // 2. Create the outfit_items records
  const outfitItems = itemIds.map(itemId => ({
    outfit_id: outfitId,
    clothing_item_id: parseInt(itemId, 10),
  }));

  const { error: itemsError } = await supabase
    .from('outfit_items')
    .insert(outfitItems);

  if (itemsError) {
    console.error('Error adding items to outfit:', itemsError);
    // Clean up the created outfit if items fail to be added
    await supabase.from('outfits').delete().eq('id', outfitId);
    return { error: 'Failed to add items to outfit.' };
  }

  // 3. Update last_used_date for the items
  const { error: updateError } = await supabase
    .from('clothing_items')
    .update({ last_used_date: new Date().toISOString() })
    .in('id', itemIds.map(id => parseInt(id, 10)));

  if (updateError) {
    console.warn('Could not update last_used_date for clothing items.', updateError);
  }

  revalidatePath('/history');
  revalidatePath('/wardrobe'); // Also revalidate wardrobe to show updated last worn date
  return { success: true, outfitId };
}