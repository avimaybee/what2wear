'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// This type should ideally be in a central types file
type ClothingItem = {
  id: number;
  user_id: string;
  category: string | null;
  color: string | null;
  season_tags: string[] | null;
  style_tags: string[] | null;
  image_url: string;
  created_at: string;
}

const categories = ['shirt', 't-shirt', 'jacket', 'pants', 'shoes', 'accessory']
const seasons = ['spring', 'summer', 'autumn', 'winter']
const styles = ['casual', 'formal', 'streetwear', 'sporty', 'business']

export default function ItemEditForm({ item }: { item: ClothingItem }) {
  const supabase = createClient()
  const router = useRouter()

  const [category, setCategory] = useState(item.category || '')
  const [color, setColor] = useState(item.color || '')
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(item.season_tags || [])
  const [selectedStyles, setSelectedStyles] = useState<string[]>(item.style_tags || [])
  
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    const { error } = await supabase
      .from('clothing_items')
      .update({
        category,
        color,
        season_tags: selectedSeasons,
        style_tags: selectedStyles,
      })
      .eq('id', item.id)

    if (error) {
      alert(`Error updating item: ${error.message}`)
    } else {
      alert('Item updated successfully!')
      router.refresh() // Refresh the page to show updated data
    }
    setIsSaving(false)
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return
    }
    setIsDeleting(true)

    // First, attempt to delete the image from storage
    const filePath = item.image_url.substring(item.image_url.lastIndexOf(item.user_id))
    const { error: storageError } = await supabase.storage.from('clothing_images').remove([filePath])

    if (storageError && storageError.message !== 'The resource was not found') {
      console.error('Could not delete image from storage:', storageError.message)
      alert(`Warning: Could not delete the image file, but will proceed with deleting the database record. Error: ${storageError.message}`)
    }

    // Then, delete the record from the database
    const { error: dbError } = await supabase
      .from('clothing_items')
      .delete()
      .eq('id', item.id)

    if (dbError) {
      alert(`Error deleting item: ${dbError.message}`)
      setIsDeleting(false)
    } else {
      alert('Item deleted successfully.')
      router.push('/wardrobe') // Redirect to the wardrobe page
    }
  }

  const handleMultiSelectChange = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(event.target.selectedOptions, option => option.value);
    setter(options);
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-6">
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}        </select>
      </div>

      <div>
        <label htmlFor="color" className="block text-sm font-medium text-gray-700">Color</label>
        <input type="text" id="color" value={color} onChange={(e) => setColor(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
      </div>

      <div>
        <label htmlFor="seasons" className="block text-sm font-medium text-gray-700">Seasons</label>
        <select id="seasons" multiple value={selectedSeasons} onChange={handleMultiSelectChange(setSelectedSeasons)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
          {seasons.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}        </select>
      </div>

      <div>
        <label htmlFor="styles" className="block text-sm font-medium text-gray-700">Styles</label>
        <select id="styles" multiple value={selectedStyles} onChange={handleMultiSelectChange(setSelectedStyles)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
          {styles.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}        </select>
      </div>

      <div className="flex items-center justify-between gap-4 pt-4 border-t">
        <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md disabled:bg-gray-400 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
            {isDeleting ? 'Deleting...' : 'Delete Item'}
        </button>
        <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md disabled:bg-gray-400 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
            {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
