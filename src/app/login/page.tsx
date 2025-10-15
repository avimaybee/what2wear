'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '../components/Button'
import Input from '../components/Input'
import { useToast } from '../components/ToastProvider'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) {
      showToast({ variant: 'error', title: 'Sign up failed', description: error.message })
    } else {
      showToast({ variant: 'success', title: 'Check your email', description: 'We sent you a confirmation link.' })
    }
  }

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      showToast({ variant: 'error', title: 'Sign in failed', description: error.message })
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
      showToast({ variant: 'error', title: 'Google sign-in failed', description: error.message })
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-md items-center px-4">
      <div className="w-full space-y-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-subtle">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <div className="space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="space-y-2">
          <Button onClick={handleSignIn} className="w-full">Sign In</Button>
          <Button onClick={handleSignUp} variant="secondary" className="w-full">Create account</Button>
        </div>
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--color-border)]"></div>
          </div>
          <div className="relative bg-[var(--color-surface)] px-2 text-sm text-[var(--color-text-muted)]">Or continue with</div>
        </div>
        <div>
          <Button onClick={handleGoogleSignIn} variant="outline" className="w-full">Google</Button>
        </div>
      </div>
    </main>
  )
}
