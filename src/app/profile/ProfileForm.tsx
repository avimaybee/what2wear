'use client'

import { useState, useTransition } from 'react'
import { updateUserProfile } from './actions'
import { type Profile } from '@/lib/types'
import Image from 'next/image'
import Input from '../components/Input'
import Button from '../components/Button'
import { useToast } from '../components/ToastProvider'

export default function ProfileForm({ profile }: { profile: Profile | null }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  const action = async (formData: FormData) => {
    startTransition(async () => {
      const result = await updateUserProfile(formData)
      if (result?.error) {
        setError(result.error)
        setSuccess(false)
        showToast({ variant: 'error', title: 'Update failed', description: result.error })
      } else {
        setError(null)
        setSuccess(true)
        showToast({ variant: 'success', title: 'Profile updated', description: 'Your profile was saved.' })
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <form action={action} className="mx-auto max-w-lg space-y-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-subtle">
      <h3 className="text-xl font-semibold text-[var(--color-text)]">Your profile</h3>

      {/* Avatar Display and Upload */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text)]">Your avatar</label>
        <div className="mt-2 flex items-center space-x-4">
          {profile?.full_body_model_url ? (
            <Image src={profile.full_body_model_url} alt="Current Avatar" width={96} height={96} className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-surface-2)]">
              <span className="text-sm text-[var(--color-text-muted)]">No avatar</span>
            </div>
          )}
          <input 
            type="file" 
            name="avatar"
            accept="image/png, image/jpeg"
            className="block w-full text-sm text-[var(--color-text-muted)] file:mr-4 file:rounded-md file:border file:border-[var(--color-border)] file:bg-[var(--color-surface-2)] file:px-4 file:py-2 file:text-sm file:font-medium hover:file:brightness-110"
          />
        </div>
      </div>

      {/* Hidden input to carry over the existing avatar URL */}
      {profile?.full_body_model_url && (
        <input type="hidden" name="current_avatar_url" value={profile.full_body_model_url} />
      )}

      {/* Name Input */}
      <Input id="name" name="name" label="Name" defaultValue={profile?.name || ''} />

      {/* Region Input */}
      <Input id="region" name="region" label="Region" defaultValue={profile?.region || ''} placeholder="e.g., North America, Europe" />

      {/* Submit Button and Messages */}
      <div>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Saving…' : 'Update profile'}
        </Button>
        {error && <p className="mt-2 text-sm text-[var(--color-error)]">Error: {error}</p>}
        {success && <p className="mt-2 text-sm text-[var(--color-success)]">Profile updated successfully!</p>}
      </div>
    </form>
  )
}
