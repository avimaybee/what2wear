import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function WardrobePage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Fetch clothing items for the user
  const { data: clothingItems, error } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">My Wardrobe</h1>
            <Link href="/" className="py-2 px-4 rounded-md no-underline bg-gray-200 hover:bg-gray-300 text-sm font-medium">
                Back to Home
            </Link>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {clothingItems && clothingItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {clothingItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden group">
                <img src={item.image_url} alt={item.category || 'Clothing item'} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <p className="text-lg font-semibold capitalize truncate group-hover:whitespace-normal">{item.category}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-4">
            <h2 className="text-xl font-semibold text-gray-800">Your wardrobe is empty</h2>
            <p className="mt-2 text-gray-500">Start by adding your first clothing item.</p>
            {/* We will add a link to the "add item" page here later */}
          </div>
        )}
      </main>
    </div>
  )
}
