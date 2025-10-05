import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AuthButton() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const signOut = async () => {
    'use server'

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    await supabase.auth.signOut()
    return redirect('/login')
  }

  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-sm">Hey, {user.email}!</span>
      <Link href="/profile" className="py-2 px-3 flex rounded-md no-underline bg-gray-200 hover:bg-gray-300 text-sm">
        Profile
      </Link>
      <form action={signOut}>
        <button className="py-2 px-3 flex rounded-md no-underline bg-indigo-200 text-indigo-800 hover:bg-indigo-300 text-sm font-semibold">
          Logout
        </button>
      </form>
    </div>
  ) : (
    <Link
      href="/login"
      className="py-2 px-3 flex rounded-md no-underline bg-gray-200 hover:bg-gray-300"
    >
      Login
    </Link>
  )
}
