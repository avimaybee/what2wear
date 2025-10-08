import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import OutfitCreator from './OutfitCreator'

export default async function CreateOutfitPage() {
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

  // The dnd-kit library expects string IDs
  const itemsWithStringIds = clothingItems.map(item => ({ ...item, id: item.id.toString() }))

  return (
    <div className="min-h-screen bg-background text-text">
      <header className="bg-surface/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <nav className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-text">Create New Outfit</h1>
          <Link
            href="/"
            className="py-2 px-4 rounded-md no-underline bg-primary text-background text-sm font-medium hover:bg-secondary transition-colors"
          >
            Back to Home
          </Link>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <OutfitCreator items={itemsWithStringIds} />
      </main>
    </div>
  )
}