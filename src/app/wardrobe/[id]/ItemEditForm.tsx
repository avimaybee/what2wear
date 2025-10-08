'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteClothingItem } from '../actions'
import ConfirmationModal from '../../components/ConfirmationModal'

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
  last_used_date: string | null;
}

const categories = ['shirt', 't-shirt', 'jacket', 'pants', 'shoes', 'accessory']
const seasons = ['spring', 'summer', 'autumn', 'winter']
const styles = ['casual', 'formal', 'streetwear', 'sporty', 'business']

export default function ItemEditForm({ item }: { item: ClothingItem }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [category, setCategory] = useState(item.category || '')
  const [color, setColor] = useState(item.color || '')
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(item.season_tags || [])
  const [selectedStyles, setSelectedStyles] = useState<string[]>(item.style_tags || [])
  
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    // This should be a server action too for consistency
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

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
      router.refresh()
    }
    setIsSaving(false)
  }

  const handleDeleteConfirm = () => {
    startTransition(async () => {
      const result = await deleteClothingItem(item.id, item.image_url)
      if (result.error) {
        alert(`Error: ${result.error}`)
        setIsModalOpen(false)
      } else {
        alert('Item deleted successfully.')
        router.push('/wardrobe')
      }
    })
  }

  const handleMultiSelectChange = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(event.target.selectedOptions, option => option.value);
    setter(options);
  };

  return (
    <>
      <form onSubmit={handleUpdate} className="space-y-6 bg-surface p-6 rounded-lg">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-text-light">Category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required className="mt-1 block w-full py-2 px-3 border border-surface bg-background rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
            {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}          </select>
        </div>

        <div>
          <label htmlFor="color" className="block text-sm font-medium text-text-light">Color</label>
          <input type="text" id="color" value={color} onChange={(e) => setColor(e.target.value)} className="mt-1 block w-full border border-surface bg-background rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"/>
        </div>

        <div>
          <label htmlFor="seasons" className="block text-sm font-medium text-text-light">Seasons</label>
          <select id="seasons" multiple value={selectedSeasons} onChange={handleMultiSelectChange(setSelectedSeasons)} className="mt-1 block w-full border border-surface bg-background rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
            {seasons.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}          </select>
        </div>

        <div>
          <label htmlFor="styles" className="block text-sm font-medium text-text-light">Styles</label>
          <select id="styles" multiple value={selectedStyles} onChange={handleMultiSelectChange(setSelectedStyles)} className="mt-1 block w-full border border-surface bg-background rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
            {styles.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-light">Last Worn</label>
          <p className="mt-1 text-sm text-text">{item.last_used_date ? new Date(item.last_used_date).toLocaleDateString() : 'Never'}</p>
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-background">
          <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={isPending}
              className="px-4 py-2 bg-error text-white font-semibold rounded-md disabled:opacity-50 hover:bg-opacity-90"
          >
              Delete Item
          </button>
          <button
              type="submit"
              disabled={isSaving || isPending}
              className="px-4 py-2 bg-primary text-background font-semibold rounded-md disabled:opacity-50 hover:bg-secondary"
          >
              {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      <ConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Clothing Item"
        message="Are you sure you want to permanently delete this item? This action cannot be undone."
        confirmText="Delete"
        isConfirming={isPending}
      />
    </>
  )
}
