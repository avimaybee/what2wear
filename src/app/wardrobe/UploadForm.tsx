'use client'

import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useState } from 'react'
import { categorizeImage } from './actions'
import Button from '../components/Button'
import { useToast } from '../components/ToastProvider'

const seasons = ['spring', 'summer', 'autumn', 'winter']
const styles = ['casual', 'formal', 'streetwear', 'sporty', 'business']

export default function UploadForm({ user }: { user: User | null }) {
  const supabase = createClient()
  const { showToast } = useToast()
  
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
      setImageUrl(null)
    }
  }

  const handleAnalyze = async () => {
    if (!file) {
      showToast({ variant: 'info', title: 'No file selected', description: 'Choose an image before analyzing.' })
      return
    }
    if (!user) {
      showToast({ variant: 'error', title: 'Not signed in', description: 'Please log in to upload items.' })
      return
    }

    setIsAnalyzing(true)

    const fileName = `${Date.now()}_${file.name}`
    const filePath = `${user.id}/${fileName}`
    const { error: uploadError } = await supabase.storage
      .from('clothing_images')
      .upload(filePath, file)

    if (uploadError) {
      showToast({ variant: 'error', title: 'Upload failed', description: uploadError.message })
      setIsAnalyzing(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('clothing_images')
      .getPublicUrl(filePath)
    
    setImageUrl(urlData.publicUrl)

    const result = await categorizeImage(urlData.publicUrl)

    if ('error' in result) {
      showToast({ variant: 'error', title: 'AI analysis failed', description: result.error })
    } else {
      setCategory(result.category || '')
      setColor(result.color || '')
      setSelectedSeasons(result.season_tags || [])
      setSelectedStyles(result.style_tags || [])
      showToast({ variant: 'success', title: 'Analysis complete', description: 'Review details and save your item.' })
    }

    setIsAnalyzing(false)
  }

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!imageUrl || !category) {
      showToast({ variant: 'info', title: 'Missing info', description: 'Analyze an image and fill category.' })
      return
    }
    if (!user) {
      showToast({ variant: 'error', title: 'Not signed in', description: 'Please log in to save items.' })
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
      showToast({ variant: 'error', title: 'Save failed', description: insertError.message })
    } else {
      showToast({ variant: 'success', title: 'Item added', description: 'Your wardrobe has been updated.' })
      window.location.reload()
    }

    setIsSaving(false)
  }

  const handleMultiSelectChange = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(event.target.selectedOptions, option => option.value);
    setter(options);
  };

  return (
    <form onSubmit={handleSave} className="mx-auto max-w-lg space-y-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-subtle">
      <h3 className="text-xl font-semibold text-text">Add New Clothing Item</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-light mb-2">Step 1: Choose and Analyze Image</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-text-light file:mr-2 file:rounded-md file:border-0 file:bg-[var(--color-surface-2)] file:px-3 file:py-2 file:text-[var(--color-text)] hover:file:brightness-110"/>
        </div>
        <Button type="button" onClick={handleAnalyze} disabled={!file || isAnalyzing} className="w-full">
          {isAnalyzing ? 'Analyzing…' : 'Analyze Image with AI'}
        </Button>
      </div>

      <div className={`space-y-4 pt-4 border-t border-background/50 ${!imageUrl ? 'opacity-50 pointer-events-none' : ''}`}>
        <label className="block text-sm font-medium text-text-light">Step 2: Review Details and Save</label>
        
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-text-light">Category</label>
          <input type="text" id="category" value={category} onChange={(e) => setCategory(e.target.value)} required className="mt-1 block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"/>
        </div>

        <div>
          <label htmlFor="color" className="block text-sm font-medium text-text-light">Color</label>
          <input type="text" id="color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g., Blue, #0000FF" className="mt-1 block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"/>
        </div>

        <div>
          <label htmlFor="seasons" className="block text-sm font-medium text-text-light">Seasons</label>
          <select id="seasons" multiple value={selectedSeasons} onChange={handleMultiSelectChange(setSelectedSeasons)} className="mt-1 block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]">
            {seasons.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}          </select>
        </div>

        <div>
          <label htmlFor="styles" className="block text-sm font-medium text-text-light">Styles</label>
          <select id="styles" multiple value={selectedStyles} onChange={handleMultiSelectChange(setSelectedStyles)} className="mt-1 block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]">
            {styles.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}          </select>
        </div>

        <Button type="submit" disabled={!imageUrl || isSaving} className="w-full">
          {isSaving ? 'Saving…' : 'Add item to wardrobe'}
        </Button>
      </div>
    </form>
  )
}
