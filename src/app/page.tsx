import AuthButton from './AuthButton'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50">
      <nav className="w-full flex justify-end p-4 absolute top-0">
        <AuthButton />
      </nav>
      <main className="flex flex-col items-center justify-center flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold text-gray-900">
          Welcome to StyleMate
        </h1>
        <p className="mt-3 text-2xl text-gray-600">
          Your personal AI stylist.
        </p>
        <div className="mt-8">
          <Link href="/wardrobe" className="px-6 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            Go to Your Wardrobe
          </Link>
        </div>
      </main>
    </div>
  )
}