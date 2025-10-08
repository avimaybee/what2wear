import { createClient } from '@/lib/supabase/server'
import AuthButton from './AuthButton'
import Link from 'next/link'
import OutfitRecommender from './wardrobe/OutfitRecommender'

export const runtime = 'edge'; // Add this line

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col items-center min-h-screen py-2 bg-background text-text">
      <nav className="w-full flex justify-end p-4 absolute top-0 right-0">
        <AuthButton />
      </nav>
      <main className="flex flex-col items-center justify-center flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold text-text">
          Welcome to StyleMate
        </h1>
        <p className="mt-3 text-lg sm:text-2xl text-text-light">
          Your personal AI stylist.
        </p>

        <div className="mt-12 w-full max-w-4xl">
          {user ? (
            <div className="space-y-8">
              <OutfitRecommender />
              <Link href="/wardrobe" className="inline-block px-6 py-3 text-lg font-semibold bg-primary text-background rounded-md hover:bg-secondary transition-colors">
                Manage Your Wardrobe
              </Link>
              <Link href="/create-outfit" className="ml-4 inline-block px-6 py-3 text-lg font-semibold bg-primary text-background rounded-md hover:bg-secondary transition-colors">
                Create Outfit
              </Link>
              <Link href="/history" className="ml-4 inline-block px-6 py-3 text-lg font-semibold bg-primary text-background rounded-md hover:bg-secondary transition-colors">
                Outfit History
              </Link>
            </div>
          ) : (
            <div className="mt-8">
              <Link href="/login" className="px-6 py-3 text-lg font-semibold bg-primary text-background rounded-md hover:bg-secondary transition-colors">
                Log In to Get Started
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
