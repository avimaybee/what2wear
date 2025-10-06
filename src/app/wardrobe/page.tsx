import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import UploadForm from './UploadForm' // Import the new component

export default async function WardrobePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Fetch clothing items for the user
  const { data: clothingItems } = await supabase
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
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 space-y-8">
        <UploadForm user={user} />

        <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Items</h2>
            {clothingItems && clothingItems.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {clothingItems.map((item) => (
                  <Link href={`/wardrobe/${item.id}`} key={item.id} className="block bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-lg transition-shadow duration-200">
                    <Image src={item.image_url} alt={item.category || 'Clothing item'} width={192} height={192} className="w-full h-48 object-cover" />
                    <div className="p-4">
                      <p className="text-lg font-semibold capitalize truncate group-hover:whitespace-normal">{item.category}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-800">Your wardrobe is empty</h2>
                <p className="mt-1 text-sm text-gray-500">Use the form above to add your first item.</p>
              </div>
            )}
        </div>
      </main>
    </div>
  )
}
