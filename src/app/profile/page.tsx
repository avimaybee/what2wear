import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProfileForm from './ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Fetch the profile data
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() // We expect only one row

  // The trigger we created should ensure a profile exists. 
  // But as a fallback, we handle the case where it might not.
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
          <Link
            href="/"
            className="py-2 px-4 rounded-md no-underline bg-gray-200 hover:bg-gray-300 text-sm font-medium"
          >
            Back to Home
          </Link>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <ProfileForm profile={profile} />
      </main>
    </div>
  )
}
