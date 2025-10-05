import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ItemEditForm from './ItemEditForm'

export default async function ItemDetailsPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: item } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id) // Ensure the user owns this item
    .single()

  if (!item) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              Item Details
            </h1>
            <Link href="/wardrobe" className="py-2 px-4 rounded-md no-underline bg-gray-200 hover:bg-gray-300 text-sm font-medium">
                Back to Wardrobe
            </Link>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
                <img src={item.image_url} alt={item.category || 'Clothing item'} className="w-full rounded-lg shadow-lg" />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
                <div>
                    <h2 className="text-2xl font-bold capitalize mb-4 border-b pb-2">{item.category}</h2>
                    <div className="space-y-3">
                        <p><strong>Color:</strong> {item.color || 'N/A'}</p>
                        <p><strong>Seasons:</strong> {item.season_tags?.join(', ') || 'N/A'}</p>
                        <p><strong>Styles:</strong> {item.style_tags?.join(', ') || 'N/A'}</p>
                        <p className="text-sm text-gray-500 pt-2">Added on: {new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="border-t pt-6">
                    <h3 className="text-xl font-bold mb-4">Edit Details</h3>
                    <ItemEditForm item={item} />
                </div>
            </div>
        </div>
      </main>
    </div>
  )
}
