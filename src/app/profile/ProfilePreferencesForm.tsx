'use client'

import { useState, useTransition } from 'react'
import { updateUserProfilePreferences } from './actions'
import { type Profile } from '@/lib/types'
import Button from '../components/Button'
import Input from '../components/Input'
import MultiSelect from '../components/MultiSelect'
import { useToast } from '../components/ToastProvider'

const styles = ['casual', 'formal', 'streetwear', 'sporty', 'business']

export default function ProfilePreferencesForm({ profile }: { profile: Profile | null }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  const [selectedStyles, setSelectedStyles] = useState<string[]>(profile?.preferences?.styles || [])
  const [preferredColors, setPreferredColors] = useState<string>(profile?.preferences?.colors?.join(', ') || '')

  const action = async () => {
    startTransition(async () => {
      const result = await updateUserProfilePreferences({
        styles: selectedStyles,
        colors: preferredColors.split(',').map(c => c.trim()).filter(Boolean),
      })
      if (result?.error) {
        setError(result.error)
        setSuccess(false)
        showToast({ variant: 'error', title: 'Save failed', description: result.error })
      } else {
        setError(null)
        setSuccess(true)
        showToast({ variant: 'success', title: 'Preferences updated', description: 'Your style preferences were saved.' })
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <form action={action} className="mx-auto mt-8 max-w-lg space-y-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-subtle">
      <h3 className="text-xl font-semibold text-[var(--color-text)]">Your style preferences</h3>

      <MultiSelect
        label="Preferred styles"
        options={styles}
        selected={selectedStyles}
        onChange={setSelectedStyles}
        placeholder="Select your preferred styles"
      />

      <Input id="colors" name="colors" label="Preferred colors" value={preferredColors} onChange={(e) => setPreferredColors(e.target.value)} placeholder="e.g., black, white, beige" />
      <p className="-mt-2 text-sm text-[var(--color-text-muted)]">Enter comma-separated colors.</p>

      <div>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Saving…' : 'Save preferences'}
        </Button>
        {error && <p className="mt-2 text-sm text-[var(--color-error)]">Error: {error}</p>}
        {success && <p className="mt-2 text-sm text-[var(--color-success)]">Preferences updated successfully!</p>}
      </div>
    </form>
  )
}
