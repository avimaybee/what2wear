'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

// Define the Profile type based on your database schema
type Profile = {
  id: string
  name: string | null
  region: string | null
}

export default function ProfileForm({ profile }: { profile: Profile | null }) {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [region, setRegion] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setRegion(profile.region || '')
    }
  }, [profile])

  const handleUpdateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!profile) return

    setLoading(true)

    const { error } = await supabase.from('profiles').update({
      name: name,
      region: region,
    }).eq('id', profile.id)

    if (error) {
      alert(`Error updating profile: ${error.message}`)
    } else {
      alert('Profile updated successfully!')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleUpdateProfile} className="p-6 border rounded-lg bg-white shadow-sm max-w-lg mx-auto space-y-4">
      <h3 className="text-xl font-semibold">Your Profile</h3>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label htmlFor="region" className="block text-sm font-medium text-gray-700">Region</label>
        <input
          type="text"
          id="region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="e.g., North America, Europe"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md disabled:bg-gray-400 hover:bg-indigo-700"
      >
        {loading ? 'Saving...' : 'Update Profile'}
      </button>
    </form>
  )
}
