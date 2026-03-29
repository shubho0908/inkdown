import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getEmailVerificationRedirectPath,
  isUserEmailVerified,
} from '@/lib/auth'

export type SupportedEmailOtpType = 'email' | 'recovery' | 'invite' | 'email_change'

/**
 * Validates and sanitizes the 'next' redirect path to prevent open redirect attacks
 */
export function getSafeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/workspace'
  }

  return next
}

/**
 * Type guard to check if a string is a supported email OTP type
 */
export function isSupportedEmailOtpType(
  type: string | null,
): type is SupportedEmailOtpType {
  return (
    type === 'email' ||
    type === 'recovery' ||
    type === 'invite' ||
    type === 'email_change'
  )
}

/**
 * Handles post-authentication flow with email verification check
 * Verifies the user is email-verified before allowing access
 */
export async function handleAuthenticatedRedirect(
  requestUrl: URL,
  next: string,
): Promise<NextResponse> {
  const supabase = await createClient()
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

/**
 * Creates an error redirect response
 */
export function createErrorRedirect(
  requestUrl: URL,
  errorMessage: string,
): NextResponse {
  const errorUrl = new URL('/auth/error', requestUrl.origin)
  errorUrl.searchParams.set('error', errorMessage)
  return NextResponse.redirect(errorUrl)
}
