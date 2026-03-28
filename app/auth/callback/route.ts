import {
  getEmailVerificationRedirectPath,
  isUserEmailVerified,
} from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

type SupportedEmailOtpType = 'email' | 'recovery' | 'invite' | 'email_change'

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/workspace'
  }

  return next
}

function isSupportedEmailOtpType(
  type: string | null,
): type is SupportedEmailOtpType {
  return (
    type === 'email' ||
    type === 'recovery' ||
    type === 'invite' ||
    type === 'email_change'
  )
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = getSafeNextPath(requestUrl.searchParams.get('next'))
  const supabase = await createClient()

  if (tokenHash && isSupportedEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user && !isUserEmailVerified(user)) {
        await supabase.auth.signOut()
        return NextResponse.redirect(
          new URL(getEmailVerificationRedirectPath(user.email), requestUrl),
        )
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }

    const errorUrl = new URL('/auth/error', requestUrl.origin)
    errorUrl.searchParams.set('error', error.message)
    return NextResponse.redirect(errorUrl)
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user && !isUserEmailVerified(user)) {
        await supabase.auth.signOut()
        return NextResponse.redirect(
          new URL(getEmailVerificationRedirectPath(user.email), requestUrl),
        )
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }

    const errorUrl = new URL('/auth/error', requestUrl.origin)
    errorUrl.searchParams.set('error', error.message)
    return NextResponse.redirect(errorUrl)
  }

  const errorUrl = new URL('/auth/error', requestUrl.origin)
  errorUrl.searchParams.set('error', 'Missing authentication code')
  return NextResponse.redirect(errorUrl)
}
