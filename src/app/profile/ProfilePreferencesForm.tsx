'use client'

import { useState, useTransition } from 'react'
import { updateUserProfilePreferences } from './actions'
import { type Profile } from '@/lib/types'

const styles = ['casual', 'formal', 'streetwear', 'sporty', 'business']

export default function ProfilePreferencesForm({ profile }: { profile: Profile | null }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [selectedStyles, setSelectedStyles] = useState<string[]>(profile?.preferences?.styles || [])
  const [preferredColors, setPreferredColors] = useState<string>(profile?.preferences?.colors?.join(', ') || '')

  const handleStyleChange = (style: string) => {
    setSelectedStyles(prev => 
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    )
  }

  const action = async () => {
    startTransition(async () => {
      const result = await updateUserProfilePreferences({
        styles: selectedStyles,
        colors: preferredColors.split(',').map(c => c.trim()).filter(Boolean),
      })
      if (result?.error) {
        setError(result.error)
        setSuccess(false)
      } else {
        setError(null)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <form action={action} className="p-6 border rounded-lg bg-surface shadow-sm max-w-lg mx-auto space-y-6 mt-8">
      <h3 className="text-xl font-semibold">Your Style Preferences</h3>

      <div>
        <label className="block text-sm font-medium text-text">Preferred Styles</label>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {styles.map(style => (
            <label key={style} className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedStyles.includes(style) ? 'bg-primary text-background' : 'bg-background'}`}>
              <input 
                type="checkbox" 
                checked={selectedStyles.includes(style)}
                onChange={() => handleStyleChange(style)}
                className="hidden"
              />
              <span className="text-sm font-medium capitalize">{style}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="colors" className="block text-sm font-medium text-text">Preferred Colors</label>
        <input
          type="text"
          id="colors"
          name="colors"
          value={preferredColors}
          onChange={(e) => setPreferredColors(e.target.value)}
          placeholder="e.g., black, white, beige"
          className="mt-1 block w-full border border-surface rounded-md shadow-sm py-2 px-3 bg-background focus:outline-none focus:ring-primary focus:border-primary"
        />
        <p className="mt-1 text-sm text-text-light">Enter comma-separated colors.</p>
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full px-4 py-2 bg-primary text-background font-semibold rounded-md disabled:opacity-50 hover:bg-secondary"
        >
          {isPending ? 'Saving...' : 'Save Preferences'}
        </button>
        {error && <p className="mt-2 text-sm text-error">Error: {error}</p>}
        {success && <p className="mt-2 text-sm text-success">Preferences updated successfully!</p>}
      </div>
    </form>
  )
}
