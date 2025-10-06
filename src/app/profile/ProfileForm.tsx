'use client'

import { useState, useTransition } from 'react'
import { updateUserProfile } from './actions'
import { type Profile } from '@/lib/types'

export default function ProfileForm({ profile }: { profile: Profile | null }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const action = async (formData: FormData) => {
    startTransition(async () => {
      const result = await updateUserProfile(formData)
      if (result?.error) {
        setError(result.error)
        setSuccess(false)
      } else {
        setError(null)
        setSuccess(true)
        // Reset success message after a few seconds
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <form action={action} className="p-6 border rounded-lg bg-white shadow-sm max-w-lg mx-auto space-y-6">
      <h3 className="text-xl font-semibold">Your Profile</h3>

      {/* Avatar Display and Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Your Avatar</label>
        <div className="mt-2 flex items-center space-x-4">
          {profile?.full_body_model_url ? (
            <img src={profile.full_body_model_url} alt="Current Avatar" className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm text-gray-500">No Avatar</span>
            </div>
          )}
          <input 
            type="file" 
            name="avatar"
            accept="image/png, image/jpeg"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
      </div>

      {/* Hidden input to carry over the existing avatar URL */}
      {profile?.full_body_model_url && (
        <input type="hidden" name="current_avatar_url" value={profile.full_body_model_url} />
      )}

      {/* Name Input */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={profile?.name || ''}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Region Input */}
      <div>
        <label htmlFor="region" className="block text-sm font-medium text-gray-700">Region</label>
        <input
          type="text"
          id="region"
          name="region"
          defaultValue={profile?.region || ''}
          placeholder="e.g., North America, Europe"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Submit Button and Messages */}
      <div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md disabled:bg-gray-400 hover:bg-indigo-700"
        >
          {isPending ? 'Saving...' : 'Update Profile'}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">Error: {error}</p>}
        {success && <p className="mt-2 text-sm text-green-600">Profile updated successfully!</p>}
      </div>
    </form>
  )
}
