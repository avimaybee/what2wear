'use client'

import { useState, useTransition as _useTransition } from 'react' // Renamed useTransition
import { getOutfitRecommendation, recordOutfit, storeOutfitFeedback } from './actions'
import { createClient } from '@/lib/supabase/client'
import OutfitCardStack from './OutfitCardStack'

type ClothingItem = {
  id: number;
  image_url: string;
  category: string | null;
};

type Outfit = ClothingItem[];

export default function OutfitRecommender() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetRecommendations = async () => {
    setLoading(true);
    setError(null);

    const result = await getOutfitRecommendation();

    if ('error' in result) {
      setError(result.error);
    } else {
      const supabase = createClient();
      const allItemIds = result.outfits.flatMap(o => o.item_ids);
      const { data: items, error: fetchError } = await supabase
        .from('clothing_items')
        .select('id, image_url, category')
        .in('id', allItemIds);

      if (fetchError) {
        setError(fetchError.message);
      } else {
        const outfitsWithDetails = result.outfits.map(outfit => {
          return outfit.item_ids.map(id => items.find(item => item.id === id)).filter(Boolean) as ClothingItem[];
        });
        setOutfits(outfitsWithDetails);
      }
    }

    setLoading(false);
  };

  const handleVote = async (outfit: Outfit, vote: 'like' | 'dislike') => {
    const itemIds = outfit.map(item => item.id);
    const { data: newOutfit, error: recordError } = await recordOutfit(itemIds);

    if (recordError) {
      console.error('Failed to record outfit:', recordError.message);
      return;
    }

    const rating = vote === 'like' ? 1 : -1;
    await storeOutfitFeedback(newOutfit!.id, rating);

    if (outfits.length <= 2) {
      handleGetRecommendations();
    }
  };

  return (
    <div className="p-6 bg-surface rounded-xl shadow-lg max-w-4xl mx-auto text-center space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text mb-4">Today&apos;s Recommendations</h2>
        <p className="text-text-light mb-6">Swipe right to like, left to dislike.</p>
        <button
          onClick={handleGetRecommendations}
          disabled={loading}
          className="px-6 py-3 bg-primary text-background font-semibold rounded-md disabled:opacity-50 hover:bg-secondary transition-colors"
        >
          {loading ? 'Thinking...' : 'Get New Recommendations'}
        </button>
      </div>

      {error && <p className="text-error mt-4">Error: {error}</p>}

      {outfits.length > 0 && (
        <OutfitCardStack outfits={outfits} onVote={handleVote} />
      )}
    </div>
  );
}