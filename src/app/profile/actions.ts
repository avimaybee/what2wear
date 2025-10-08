'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function updateUserProfile(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  const name = formData.get('name') as string
  const region = formData.get('region') as string
  const avatarFile = formData.get('avatar') as File

  let avatarUrl = formData.get('current_avatar_url') as string;

  // Handle file upload
  if (avatarFile && avatarFile.size > 0) {
    const fileName = `${user.id}-${Date.now()}`
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile)

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      return { error: 'Failed to upload avatar.' }
    }
    
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
    avatarUrl = urlData.publicUrl
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      name: name,
      region: region,
      full_body_model_url: avatarUrl,
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('Error updating profile:', updateError)
    return { error: 'Failed to update profile.' }
  }

  revalidatePath('/profile')
  return { success: true }
}

export async function updateUserProfilePreferences(preferences: { styles: string[], colors: string[] }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to update preferences.' }
  }

  // Retrieve the current profile to merge preferences
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Error fetching profile for preferences update:', profileError)
    return { error: 'Could not retrieve existing profile data.' }
  }

  const newPreferences = {
    ...profile.preferences,
    ...preferences,
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ preferences: newPreferences })
    .eq('id', user.id)

  if (updateError) {
    console.error('Error updating preferences:', updateError)
    return { error: 'Failed to update preferences.' }
  }

  revalidatePath('/profile')
  return { success: true }
}