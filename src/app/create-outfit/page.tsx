import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import OutfitCreatorWrapper from './OutfitCreatorWrapper'

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
    <div className="min-h-screen text-[var(--color-text)]">
      <header className="sticky top-0 z-10 bg-[var(--color-surface)]/80 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">Create new outfit</h1>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={null}>
          <OutfitCreatorWrapper items={itemsWithStringIds} />
        </Suspense>
      </main>
    </div>
  )
}