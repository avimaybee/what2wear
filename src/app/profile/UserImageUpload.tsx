'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Profile } from '@/lib/types'

export default function UserImageUpload({ profile }: { profile: Profile | null }) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.user_image_url) {
      setUserImageUrl(profile.user_image_url)
    }
  }, [profile])

  useEffect(() => {
    if (selectedImage) {
      const objectUrl = URL.createObjectURL(selectedImage)
      setPreviewUrl(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    }
  }, [selectedImage])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedImage(event.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedImage || !profile) return

    setUploading(true)
    const file = selectedImage
    const fileName = `${profile.id}/${Date.now()}_${file.name}`

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('user_images')
      .upload(fileName, file)

    if (uploadError) {
      alert(`Error uploading image: ${uploadError.message}`)
      setUploading(false)
      return
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user_images')
      .getPublicUrl(fileName)

    if (!publicUrl) {
      alert('Error getting public URL.')
      setUploading(false)
      return
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ user_image_url: publicUrl })
      .eq('id', profile.id)

    if (updateError) {
      alert(`Error updating profile: ${updateError.message}`)
    } else {
      setUserImageUrl(publicUrl)
      alert('Image uploaded successfully!')
    }

    setUploading(false)
    setSelectedImage(null)
    setPreviewUrl(null)
  }

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm max-w-lg mx-auto space-y-4 mt-8">
      <h3 className="text-xl font-semibold">Your Full-Body Photo</h3>

      <div className="flex flex-col items-center space-y-4">
        {previewUrl ? (
          <Image src={previewUrl} alt="Selected image preview" width={256} height={256} className="rounded-md object-cover" />
        ) : userImageUrl ? (
          <Image src={userImageUrl} alt="Current user image" width={256} height={256} className="rounded-md object-cover" />
        ) : (
          <div className="w-64 h-64 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
            No image uploaded
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="user-image-upload" className="block text-sm font-medium text-gray-700">
          {userImageUrl ? 'Change your photo' : 'Upload a photo'}
        </label>
        <input
          type="file"
          id="user-image-upload"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
        />
      </div>

      {selectedImage && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md disabled:bg-gray-400 hover:bg-indigo-700"
        >
          {uploading ? 'Uploading...' : 'Upload and Save'}
        </button>
      )}
    </div>
  )
}