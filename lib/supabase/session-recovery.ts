import { type NextRequest, NextResponse } from 'next/server'

const RECOVERABLE_SESSION_ERROR_CODES = new Set([
  'bad_jwt',
  'refresh_token_already_used',
  'refresh_token_not_found',
  'session_expired',
  'session_not_found',
])

function getAuthErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return null
  }

  return typeof error.code === 'string' ? error.code : null
}

export function getRecoverableSessionErrorCode(error: unknown): string | null {
  const code = getAuthErrorCode(error)

  if (!code || !RECOVERABLE_SESSION_ERROR_CODES.has(code)) {
    return null
  }

  return code
}

export function hasSupabaseAuthCookies(request: NextRequest): boolean {
  return request.cookies.getAll().some(({ name }) => name.startsWith('sb-'))
}

export function clearSupabaseAuthCookies(
  request: NextRequest,
  response: NextResponse,
): void {
  for (const { name } of request.cookies.getAll()) {
    if (!name.startsWith('sb-')) {
      continue
    }

    request.cookies.delete(name)
    response.cookies.set(name, '', {
      maxAge: 0,
      path: '/',
    })
  }
}
