'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export const runtime = 'edge'; // Add this line

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) {
      alert(error.message)
    } else {
      alert('Check your email for a confirmation link!')
    }
  }

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      alert(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) {
      alert(error.message)
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-background text-text">
      <div className="w-full max-w-xs p-8 space-y-6 bg-surface rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-text">StyleMate</h1>
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-text-light">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-text bg-background border border-surface rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-text-light">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-text bg-background border border-surface rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="••••••••"
            />
          </div>
        </div>
        <div className="space-y-2">
          <button onClick={handleSignIn} className="w-full px-4 py-2 font-bold bg-primary text-background rounded-md hover:bg-secondary transition-colors">Sign In</button>
          <button onClick={handleSignUp} className="w-full px-4 py-2 font-bold text-primary bg-background border border-surface rounded-md hover:bg-secondary hover:text-background transition-colors">Sign Up</button>
        </div>
        <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface"></div>
            </div>
            <div className="relative px-2 text-sm text-text-light bg-surface">Or continue with</div>
        </div>
        <div>
          <button onClick={handleGoogleSignIn} className="w-full px-4 py-2 font-bold text-text bg-background border border-surface rounded-md hover:bg-secondary hover:text-background transition-colors">Google</button>
        </div>
      </div>
    </div>
  )
}