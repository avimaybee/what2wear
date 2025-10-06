
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
      // Optionally, return an error message to the user
      return { error: 'Failed to upload avatar.' }
    }
    
    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
    avatarUrl = urlData.publicUrl

    // TODO: Task 18 - Avatar Generation Endpoint
    // At this point, you would ideally call another service (or a Gemini model)
    // to process `avatarUrl` (e.g., remove background, create a standardized model)
    // and save the *new* processed URL. For now, we'll save the direct upload URL.
  }

  // Update the profile in the database
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

  // Revalidate the profile page to show the new data immediately
  // revalidatePath('/profile') // This requires further configuration in Next.js
  return { success: true }
}
