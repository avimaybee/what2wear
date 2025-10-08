import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOutfitHistory } from './actions'
import OutfitHistoryList from './OutfitHistoryList'

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { outfits: initialOutfits, error } = await getOutfitHistory(1)

  if (error) {
    // Handle error appropriately
    return <p className="text-center text-error">{error}</p>
  }

  return (
    <div className="min-h-screen bg-background text-text">
      <header className="bg-surface/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <nav className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-text">Outfit History</h1>
          <Link
            href="/"
            className="py-2 px-4 rounded-md no-underline bg-primary text-background text-sm font-medium hover:bg-secondary transition-colors"
          >
            Back to Home
          </Link>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <OutfitHistoryList initialOutfits={initialOutfits || []} />
      </main>
    </div>
  )
}