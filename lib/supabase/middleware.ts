import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  AUTH_ERROR_MESSAGES,
  getEmailVerificationRedirectPath,
  requireVerifiedUser,
} from '@/lib/auth'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })
  type CookieToSet = {
    name: string
    value: string
    options?: Parameters<typeof supabaseResponse.cookies.set>[2]
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const authState = await requireVerifiedUser(supabase)
  const user =
    authState.kind === 'authenticated' || authState.kind === 'unverified'
      ? authState.user
      : null
  const pathname = request.nextUrl.pathname
  const isApiRoute = pathname.startsWith('/api/')
  const isAuthRoute = pathname.startsWith('/auth')
  const isAuthCallbackRoute = pathname.startsWith('/auth/callback')
  const isSignUpSuccessRoute = pathname.startsWith('/auth/sign-up-success')
  const isAuthErrorRoute = pathname.startsWith('/auth/error')

  // The workspace now lives at "/", so keep legacy dashboard URLs canonical.
  if (pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (authState.kind === 'unverified') {
    await supabase.auth.signOut()

    if (isApiRoute) {
      return NextResponse.json(
        { error: AUTH_ERROR_MESSAGES.emailNotVerified },
        { status: 403 },
      )
    }

    if (!isAuthCallbackRoute && !isSignUpSuccessRoute && !isAuthErrorRoute) {
      const redirectPath = getEmailVerificationRedirectPath(authState.user.email)
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }

    return supabaseResponse
  }

  // Redirect authenticated users away from auth pages to the workspace root.
  if (isAuthRoute && !isAuthCallbackRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
