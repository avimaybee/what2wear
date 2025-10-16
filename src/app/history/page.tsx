import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getOutfitHistory } from './actions'
import OutfitHistoryList from './OutfitHistoryList'
import { History as HistoryIcon, Sparkles } from 'lucide-react'

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
            <HistoryIcon className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-destructive text-lg">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <HistoryIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-serif">Outfit History</h1>
            </div>
          </div>
          <p className="text-muted-foreground text-lg ml-15">Track your style journey and favorite combinations</p>
        </div>

        <OutfitHistoryList initialOutfits={initialOutfits || []} />
      </div>
    </div>
  )
}
