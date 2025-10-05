import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import AuthButton from './AuthButton'
import Link from 'next/link'
import OutfitRecommender from './wardrobe/OutfitRecommender'

export default async function Home() {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col items-center min-h-screen py-2 bg-gray-50">
      <nav className="w-full flex justify-end p-4 absolute top-0 right-0">
        <AuthButton />
      </nav>
      <main className="flex flex-col items-center justify-center flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900">
          Welcome to StyleMate
        </h1>
        <p className="mt-3 text-lg sm:text-2xl text-gray-600">
          Your personal AI stylist.
        </p>

        <div className="mt-12 w-full max-w-4xl">
          {user ? (
            <div className="space-y-8">
              <OutfitRecommender />
              <Link href="/wardrobe" className="inline-block px-6 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                Manage Your Wardrobe
              </Link>
            </div>
          ) : (
            <div className="mt-8">
              <Link href="/login" className="px-6 py-3 text-lg font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                Log In to Get Started
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}