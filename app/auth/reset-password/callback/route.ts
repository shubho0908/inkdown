import { type NextRequest, NextResponse } from 'next/server'

const RESET_PASSWORD_PATH = '/auth/reset-password'

function createResetRedirect(requestUrl: URL, params?: URLSearchParams) {
  const resetUrl = new URL(RESET_PASSWORD_PATH, requestUrl.origin)

  if (params) {
    params.forEach((value, key) => {
      resetUrl.searchParams.set(key, value)
    })
  }

  return NextResponse.redirect(resetUrl)
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const redirectParams = new URLSearchParams()

  if (code) {
    redirectParams.set('code', code)
    return createResetRedirect(requestUrl, redirectParams)
  }

  if (tokenHash && type === 'recovery') {
    redirectParams.set('token_hash', tokenHash)
    redirectParams.set('type', 'recovery')
    return createResetRedirect(requestUrl, redirectParams)
  }

  redirectParams.set('issue', 'invalid')
  redirectParams.set('error', 'Missing password reset code')
  return createResetRedirect(requestUrl, redirectParams)
}
