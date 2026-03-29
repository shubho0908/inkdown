import { createClient } from '@/lib/supabase/server'
import { type NextRequest } from 'next/server'
import {
  getSafeNextPath,
  isSupportedEmailOtpType,
  handleAuthenticatedRedirect,
  createErrorRedirect,
} from '@/lib/auth/route-utils'

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
      return handleAuthenticatedRedirect(requestUrl, next)
    }

    return createErrorRedirect(requestUrl, error.message)
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return handleAuthenticatedRedirect(requestUrl, next)
    }

    return createErrorRedirect(requestUrl, error.message)
  }

  return createErrorRedirect(requestUrl, 'Missing authentication code')
}
