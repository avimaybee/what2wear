'use client'

import { useState, useTransition } from 'react'
import { getOutfitRecommendation, recordOutfit, storeOutfitFeedback, renderOutfit } from './actions'
import { createClient } from '@/lib/supabase/client'

type ClothingItem = {
  id: number;
  image_url: string;
  category: string | null;
}

export default function OutfitRecommender() {
  const [recommendedItems, setRecommendedItems] = useState<ClothingItem[]>([])
  const [outfitId, setOutfitId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // State for feedback
  const [feedbackGiven, setFeedbackGiven] = useState<'like' | 'dislike' | null>(null)

  // State for virtual try-on
  const [renderedImageUrl, setRenderedImageUrl] = useState<string | null>(null)
  const [isRendering, startRenderingTransition] = useTransition()

  const handleGetRecommendation = async () => {
    setLoading(true)
    setError(null)
    setRecommendedItems([])
    setOutfitId(null)
    setFeedbackGiven(null)
    setRenderedImageUrl(null)

    const result = await getOutfitRecommendation()

    if ('error' in result) {
      setError(result.error)
    } else {
      // First, save the outfit to get an ID
      const { data: newOutfit, error: recordError } = await recordOutfit(result.item_ids)
      if (recordError) {
        setError(recordError.message)
        setLoading(false)
        return
      }
      setOutfitId(newOutfit!.id)

      // Then, fetch item details to display
      const supabase = createClient()
      const { data: items, error: fetchError } = await supabase
        .from('clothing_items')
        .select('id, image_url, category')
        .in('id', result.item_ids)
      
      if (fetchError) {
        setError(fetchError.message)
      } else if (items) {
        const orderedItems = result.item_ids.map(id => items.find(item => item.id === id)).filter(Boolean) as ClothingItem[];
        setRecommendedItems(orderedItems)
      }
    }

    setLoading(false)
  }

  const handleFeedback = async (rating: 1 | -1) => {
    if (!outfitId) return;
    setFeedbackGiven(rating === 1 ? 'like' : 'dislike');
    await storeOutfitFeedback(outfitId, rating);
    // In a real app, you might want to show a confirmation
  }

  const handleRenderOutfit = async () => {
    if (!outfitId) return;
    startRenderingTransition(async () => {
      setError(null);
      const result = await renderOutfit(outfitId);
      if (result.error) {
        setError(result.error);
      } else {
        setRenderedImageUrl(result.renderedUrl);
      }
    });
  }

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm max-w-4xl mx-auto text-center space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Get Your Outfit for Today</h2>
        <button
          onClick={handleGetRecommendation}
          disabled={loading}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md disabled:bg-gray-400 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {loading ? 'Thinking...' : 'Get New Recommendation'}
        </button>
      </div>

      {error && <p className="text-red-500 mt-4">Error: {error}</p>}

      {recommendedItems.length > 0 && (
        <div className="border-t pt-6">
          {/* Rendered Image Display */}
          {renderedImageUrl ? (
            <div>
              <h3 className="text-xl font-semibold mb-4">Your Virtual Try-On:</h3>
              <img src={renderedImageUrl} alt="Virtual Try-On" className="w-full max-w-md mx-auto rounded-lg shadow-lg" />
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-semibold mb-4">Today's Recommended Outfit:</h3>
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

          {/* Actions: Feedback and Try-On */}
          <div className="mt-6 flex justify-center items-center space-x-4">
            {/* Feedback Buttons */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleFeedback(1)} 
                disabled={!!feedbackGiven} 
                className={`px-4 py-2 rounded-full text-2xl transition-transform duration-150 ${feedbackGiven === 'like' ? 'bg-green-200 scale-110' : 'bg-gray-100 hover:bg-gray-200'}`}>
                👍
              </button>
              <button 
                onClick={() => handleFeedback(-1)} 
                disabled={!!feedbackGiven} 
                className={`px-4 py-2 rounded-full text-2xl transition-transform duration-150 ${feedbackGiven === 'dislike' ? 'bg-red-200 scale-110' : 'bg-gray-100 hover:bg-gray-200'}`}>
                👎
              </button>
            </div>

            {/* Virtual Try-On Button */}
            {!renderedImageUrl && (
              <button
                onClick={handleRenderOutfit}
                disabled={isRendering}
                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md disabled:bg-gray-400 hover:bg-indigo-700"
              >
                {isRendering ? 'Rendering...' : 'Create Virtual Try-On'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
