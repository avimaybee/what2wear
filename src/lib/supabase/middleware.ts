import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // Refresh the session
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const isAuthPage = url.pathname.startsWith('/auth')
  const isOnboarding = url.pathname === '/onboarding'

  // If user is not authenticated and trying to access protected routes
  if (!user && !isAuthPage && !isOnboarding) {
    url.pathname = '/auth/sign-in'
    return NextResponse.redirect(url)
  }

  // If user is authenticated and on auth pages, redirect to home
  if (user && isAuthPage) {
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Check if user needs onboarding (new user without profile)
  if (user && !isOnboarding && !isAuthPage) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // If no profile exists, redirect to onboarding
      if (!profile) {
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
    } catch (error) {
      // Profile doesn't exist, redirect to onboarding
      if (!isOnboarding) {
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
