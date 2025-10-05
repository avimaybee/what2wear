'use client'

import { useState } from 'react'
import { getOutfitRecommendation } from './actions'
import { createClient } from '@/lib/supabase/client'

type ClothingItem = {
  id: number;
  image_url: string;
  category: string | null;
}

export default function OutfitRecommender() {
  const [recommendedItems, setRecommendedItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGetRecommendation = async () => {
    setLoading(true)
    setError(null)
    setRecommendedItems([])

    const result = await getOutfitRecommendation()

    if ('error' in result) {
      setError(result.error)
    } else {
      // We have the IDs, now fetch the item details
      const supabase = createClient()
      const { data: items, error: fetchError } = await supabase
        .from('clothing_items')
        .select('id, image_url, category')
        .in('id', result.item_ids)
      
      if (fetchError) {
        setError(fetchError.message)
      } else if (items) {
        // Ensure the order is the same as what the AI recommended
        const orderedItems = result.item_ids.map(id => items.find(item => item.id === id)).filter(Boolean) as ClothingItem[];
        setRecommendedItems(orderedItems)
      }
    }

    setLoading(false)
  }

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm max-w-4xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4">Get Your Outfit for Today</h2>
      <button
        onClick={handleGetRecommendation}
        disabled={loading}
        className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md disabled:bg-gray-400 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        {loading ? 'Thinking...' : 'Get Recommendation'}
      </button>

      {error && <p className="text-red-500 mt-4">Error: {error}</p>}

      {recommendedItems.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Today's Outfit:</h3>
          <div className="grid grid-cols-3 gap-4">
            {recommendedItems.map(item => (
              <div key={item.id} className="border rounded-lg p-2 bg-gray-50">
                <img src={item.image_url} alt={item.category || 'Clothing item'} className="w-full h-48 object-cover rounded-md" />
                <p className="text-center mt-2 capitalize font-medium">{item.category}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
