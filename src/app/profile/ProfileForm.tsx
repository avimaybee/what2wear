'use client'

import { useState, useTransition } from 'react'
import { updateUserProfile } from './actions'
import { type Profile } from '@/lib/types'
import Image from 'next/image'
import Input from '../components/Input'
import { Button } from '@/components/ui/button'
import { useToast } from '../components/ToastProvider'
import { Card, CardContent } from '../components/Card'
import { Camera } from 'lucide-react'

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
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="space-y-6">
          {/* Avatar Display and Upload */}
          <div>
            <label className="block text-sm font-medium mb-3">Profile Picture</label>
            <div className="flex items-center gap-6">
              <div className="relative group">
                {profile?.full_body_model_url ? (
                  <div className="relative">
                    <Image 
                      src={profile.full_body_model_url} 
                      alt="Current Avatar" 
                      width={96} 
                      height={96} 
                      className="h-24 w-24 rounded-full object-cover border-2 border-border shadow-lg" 
                    />
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-2 border-2 border-border group-hover:border-primary transition-colors">
                    <Camera className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input 
                  type="file" 
                  name="avatar"
                  accept="image/png, image/jpeg"
                  className="block w-full text-sm text-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer file:transition-colors"
                />
                <p className="mt-2 text-xs text-muted-foreground">PNG or JPEG, max 5MB</p>
              </div>
            </div>
          </div>

          {/* Hidden input to carry over the existing avatar URL */}
          {profile?.full_body_model_url && (
            <input type="hidden" name="current_avatar_url" value={profile.full_body_model_url} />
          )}

          {/* Name Input */}
          <Input 
            id="name" 
            name="name" 
            label="Full Name" 
            defaultValue={profile?.name || ''} 
            placeholder="Enter your name"
          />

          {/* Region Input */}
          <Input 
            id="region" 
            name="region" 
            label="Location" 
            defaultValue={profile?.region || ''} 
            placeholder="e.g., San Francisco, CA" 
          />

          {/* Submit Button and Messages */}
          <div className="pt-4">
            <Button type="submit" disabled={isPending} className="w-full h-12">
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Update Profile'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
