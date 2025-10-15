import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import OutfitRecommender from './wardrobe/OutfitRecommender'
import Button from './components/Button'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 pt-8 text-center">
      <h1 className="text-[2rem] font-bold tracking-tight sm:text-[2.75rem]">Your personal AI stylist</h1>
      <p className="mt-3 max-w-prose text-base text-[var(--color-text-muted)] sm:text-lg">
        Build a wardrobe you love. Get daily recommendations tailored to your style and weather.
      </p>

      <div className="mt-8 w-full max-w-4xl">
        {user ? (
          <div className="space-y-8">
            <OutfitRecommender />
            <div className="flex justify-center">
              <Link href="/wardrobe">
                <Button size="md">Manage your wardrobe</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex justify-center gap-3">
            <Link href="/login">
              <Button size="md">Log in to get started</Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}