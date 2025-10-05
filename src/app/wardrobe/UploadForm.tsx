'use client'

import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useState } from 'react'
import { categorizeImage } from './actions'

const categories = ['shirt', 't-shirt', 'jacket', 'pants', 'shoes', 'accessory']
const seasons = ['spring', 'summer', 'autumn', 'winter']
const styles = ['casual', 'formal', 'streetwear', 'sporty', 'business']

export default function ItemCreationForm({ user }: { user: User | null }) {
  const supabase = createClient()
  
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  
  const [category, setCategory] = useState('')
  const [color, setColor] = useState('')
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([])
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0])
      setImageUrl(null) // Reset image URL when a new file is selected
    }
  }

  const handleAnalyze = async () => {
    if (!file) {
      alert('Please select a file to analyze.')
      return
    }
    if (!user) {
      alert('You must be logged in.')
      return
    }

    setIsAnalyzing(true)

    // 1. Upload image
    const fileName = `${Date.now()}_${file.name}`
    const filePath = `${user.id}/${fileName}`
    const { error: uploadError } = await supabase.storage
      .from('clothing_images')
      .upload(filePath, file)

    if (uploadError) {
      alert(`Error uploading file: ${uploadError.message}`)
      setIsAnalyzing(false)
      return
    }

    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from('clothing_images')
      .getPublicUrl(filePath)
    
    setImageUrl(urlData.publicUrl)

    // 3. Call AI categorization action
    const result = await categorizeImage(urlData.publicUrl)

    if ('error' in result) {
      alert(`AI analysis failed: ${result.error}`)
    } else {
      // 4. Populate form fields
      setCategory(result.category || '')
      setColor(result.color || '')
      setSelectedSeasons(result.season_tags || [])
      setSelectedStyles(result.style_tags || [])
      alert('Analysis complete! Please review the details below.')
    }

    setIsAnalyzing(false)
  }

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!imageUrl || !category) {
      alert('Please analyze an image and ensure category is filled.')
      return
    }
    if (!user) {
      alert('You must be logged in.')
      return
    }

    setIsSaving(true)

    const { error: insertError } = await supabase.from('clothing_items').insert({
      user_id: user.id,
      image_url: imageUrl,
      category: category,
      color: color,
      season_tags: selectedSeasons,
      style_tags: selectedStyles,
    })

    if (insertError) {
      alert(`Error saving item: ${insertError.message}`)
    } else {
      alert('Item added to your wardrobe!')
      window.location.reload()
    }

    setIsSaving(false)
  }

  const handleMultiSelectChange = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(event.target.selectedOptions, option => option.value);
    setter(options);
  };

  return (
    <form onSubmit={handleSave} className="p-6 border rounded-lg bg-white shadow-sm max-w-lg mx-auto space-y-6">
      <h3 className="text-xl font-semibold">Add New Clothing Item</h3>
      
      <div className="space-y-2 p-4 border-b">
        <label className="block text-sm font-medium text-gray-700">Step 1: Choose and Analyze Image</label>
        <input type="file" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
        <button type="button" onClick={handleAnalyze} disabled={!file || isAnalyzing} className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md disabled:bg-gray-400 hover:bg-blue-700">
          {isAnalyzing ? 'Analyzing...' : 'Analyze Image with AI'}
        </button>
      </div>

      <div className={`space-y-4 p-4 ${!imageUrl ? 'opacity-50 pointer-events-none' : ''}`}>
        <label className="block text-sm font-medium text-gray-700">Step 2: Review Details and Save</label>
        
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            <option value="" disabled>Select a category</option>
            {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}          </select>
        </div>

        <div>
          <label htmlFor="color" className="block text-sm font-medium text-gray-700">Color</label>
          <input type="text" id="color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g., Blue, #0000FF" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>

        <div>
          <label htmlFor="seasons" className="block text-sm font-medium text-gray-700">Seasons</label>
          <select id="seasons" multiple value={selectedSeasons} onChange={handleMultiSelectChange(setSelectedSeasons)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            {seasons.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}          </select>
        </div>

        <div>
          <label htmlFor="styles" className="block text-sm font-medium text-gray-700">Styles</label>
          <select id="styles" multiple value={selectedStyles} onChange={handleMultiSelectChange(setSelectedStyles)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            {styles.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}          </select>
        </div>

        <button type="submit" disabled={!imageUrl || isSaving} className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md disabled:bg-gray-400 hover:bg-indigo-700">
          {isSaving ? 'Saving...' : 'Add Item to Wardrobe'}
        </button>
      </div>
    </form>
  )
}
