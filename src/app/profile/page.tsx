import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProfileForm from './ProfileForm'
import ProfilePreferencesForm from './ProfilePreferencesForm'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error)
  }

  return (
    <div className="min-h-screen bg-background text-text">
      <header className="bg-surface shadow-sm">
        <nav className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-text">User Profile</h1>
          <Link
            href="/"
            className="py-2 px-4 rounded-md no-underline bg-primary text-background text-sm font-medium hover:bg-secondary"
          >
            Back to Home
          </Link>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <ProfileForm profile={profile} />
        <ProfilePreferencesForm profile={profile} />
      </main>
    </div>
  )
}