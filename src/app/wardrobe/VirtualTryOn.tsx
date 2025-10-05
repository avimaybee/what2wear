'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Profile } from '@/lib/types'
import { ClothingItem } from './types' // Assuming a type definition exists

export default function VirtualTryOn() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [recommendedOutfit, setRecommendedOutfit] = useState<ClothingItem[] | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfileAndRecommendations = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
      } else {
        setProfile(profileData)
      }

      // Fetch recommendations (this is a placeholder, replace with your actual logic)
      // For now, let's just grab a few items from the wardrobe as a mock recommendation.
      const { data: items, error: itemsError } = await supabase
        .from('clothing_items')
        .select('*')
        .limit(3) // Example: top, bottom, shoes

      if (itemsError) {
        console.error('Error fetching clothing items:', itemsError)
        setError('Could not load outfit recommendations.')
      } else {
        setRecommendedOutfit(items)
      }
    };

    fetchProfileAndRecommendations()
  }, [supabase])

  const handleGenerateClick = async () => {
    if (!profile?.user_image_url || !recommendedOutfit) {
      setError('Please upload a photo and ensure you have clothing items in your wardrobe.')
      return
    }

    setLoading(true)
    setError(null)
    setGeneratedImage(null)

    const clothingItemsUrls = recommendedOutfit.map(item => item.image_url)

    try {
      const response = await fetch('/api/render-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userImageUrl: profile.user_image_url,
          clothingItemsUrls: clothingItemsUrls,
          userId: profile.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate outfit.')
      }

      const { generatedImageUrl } = await response.json()
      setGeneratedImage(generatedImageUrl)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const canGenerate = profile?.user_image_url && recommendedOutfit && recommendedOutfit.length > 0;

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm max-w-2xl mx-auto space-y-6">
      <h3 className="text-2xl font-bold text-center text-gray-800">Virtual Try-On</h3>

      {generatedImage ? (
        <div className="flex flex-col items-center space-y-4">
            <h4 className="text-xl font-semibold">Here&apos;s your look!</h4>
            <Image src={generatedImage} alt="Generated virtual try-on" width={512} height={512} className="rounded-lg object-cover" />
        </div>
      ) : (
         <div className="flex flex-col items-center justify-center h-96 bg-gray-100 rounded-lg">
            <p className="text-gray-500">Your generated outfit will appear here.</p>
         </div>
      )}

      <button
        onClick={handleGenerateClick}
        disabled={!canGenerate || loading}
        className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-md disabled:bg-gray-400 hover:bg-green-700 transition-colors"
      >
        {loading ? 'Generating Your Outfit...' : 'Generate Virtual Try-On'}
      </button>

      {!canGenerate && !loading && (
         <p className="text-center text-sm text-red-500">
            Please <a href="/profile" className="underline">upload a photo of yourself</a> and add items to your wardrobe to enable this feature.
        </p>
      )}

      {error && <p className="text-center text-red-600 mt-4">{error}</p>}
    </div>
  )
}