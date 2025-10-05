'use client'

import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useState } from 'react'

// These should match the ENUM types in your database schema
const categories = ['shirt', 't-shirt', 'jacket', 'pants', 'shoes', 'accessory']
const seasons = ['spring', 'summer', 'autumn', 'winter']
const styles = ['casual', 'formal', 'streetwear', 'sporty', 'business']

export default function ItemCreationForm({ user }: { user: User | null }) {
  const supabase = createClient()
  
  // Form state
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState('')
  const [color, setColor] = useState('')
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([])
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0])
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!file || !category) {
      alert('Please select a file and a category.')
      return
    }
    if (!user) {
      alert('You must be logged in.')
      return
    }

    setIsUploading(true)

    // 1. Upload the image
    const fileName = `${Date.now()}_${file.name}`
    const filePath = `${user.id}/${fileName}`
    const { error: uploadError } = await supabase.storage
      .from('clothing_images')
      .upload(filePath, file)

    if (uploadError) {
      alert(`Error uploading file: ${uploadError.message}`)
      setIsUploading(false)
      return
    }

    // 2. Get the public URL
    const { data: urlData } = supabase.storage
      .from('clothing_images')
      .getPublicUrl(filePath)

    // 3. Insert the new item into the database
    const { error: insertError } = await supabase.from('clothing_items').insert({
      user_id: user.id,
      image_url: urlData.publicUrl,
      category: category,
      color: color,
      season_tags: selectedSeasons,
      style_tags: selectedStyles,
    })

    if (insertError) {
      alert(`Error saving item: ${insertError.message}`)
    } else {
      alert('Item added to your wardrobe!')
      // Reset form and reload to see the new item
      window.location.reload()
    }

    setIsUploading(false)
  }

  // Handlers for multi-select
  const handleMultiSelectChange = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(event.target.selectedOptions, option => option.value);
    setter(options);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 border rounded-lg bg-white shadow-sm max-w-lg mx-auto space-y-4">
      <h3 className="text-xl font-semibold">Add New Clothing Item</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Image</label>
        <input type="file" accept="image/*" onChange={handleFileChange} required className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          <option value="" disabled>Select a category</option>
          {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}        </select>
      </div>

      <div>
        <label htmlFor="color" className="block text-sm font-medium text-gray-700">Color (optional)</label>
        <input type="text" id="color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g., Blue, #0000FF" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
      </div>

      <div>
        <label htmlFor="seasons" className="block text-sm font-medium text-gray-700">Seasons (optional, hold Ctrl/Cmd to select multiple)</label>
        <select id="seasons" multiple value={selectedSeasons} onChange={handleMultiSelectChange(setSelectedSeasons)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
          {seasons.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}        </select>
      </div>

      <div>
        <label htmlFor="styles" className="block text-sm font-medium text-gray-700">Styles (optional, hold Ctrl/Cmd to select multiple)</label>
        <select id="styles" multiple value={selectedStyles} onChange={handleMultiSelectChange(setSelectedStyles)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
          {styles.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}        </select>
      </div>

      <button type="submit" disabled={isUploading} className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md disabled:bg-gray-400 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        {isUploading ? 'Saving...' : 'Add Item to Wardrobe'}
      </button>
    </form>
  )
}