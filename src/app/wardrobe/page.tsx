import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UploadForm from './UploadForm'
import WardrobeGrid from './WardrobeGrid'

export const runtime = 'edge'; // Add this line

export default async function WardrobePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { data: clothingItems, error } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return <p className="text-center text-error">{error.message}</p>
  }

  return (
    <div className="min-h-screen bg-background text-text">
      <header className="bg-surface/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <nav className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-text">My Wardrobe</h1>
          <Link
            href="/"
            className="py-2 px-4 rounded-md no-underline bg-primary text-background text-sm font-medium hover:bg-secondary transition-colors"
          >
            Back to Home
          </Link>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 space-y-12">
        <UploadForm user={user} />

        <div className="border-t border-white/10 pt-8">
          <h2 className="text-2xl font-bold text-text mb-6">Your Items</h2>
          {clothingItems && clothingItems.length > 0 ? (
            <WardrobeGrid items={clothingItems} />
          ) : (
            <div className="text-center py-16 px-4 border-2 border-dashed border-surface rounded-xl">
              <h2 className="text-xl font-semibold text-text">Your wardrobe is empty</h2>
              <p className="mt-2 text-sm text-text-light">Use the form above to add your first item.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
