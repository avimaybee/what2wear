import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import OutfitCreatorWrapper from './OutfitCreatorWrapper'
import { Palette } from 'lucide-react'

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
    return <p className="text-center text-destructive">{error.message}</p>
  }

  // The dnd-kit library expects string IDs
  const itemsWithStringIds = clothingItems.map(item => ({ ...item, id: item.id.toString() }))

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-serif">Create Outfit</h1>
            </div>
          </div>
          <p className="text-muted-foreground text-lg ml-15">Mix and match items from your wardrobe</p>
        </div>

        <Suspense fallback={null}>
          <OutfitCreatorWrapper items={itemsWithStringIds} />
        </Suspense>
      </div>
    </div>
  )
}
