import { NextResponse } from 'next/server'
import { AUTH_ERROR_MESSAGES, type VerifiedUserResult } from '@/lib/auth'

export function createAuthErrorResponse(
  authState: Exclude<VerifiedUserResult, { kind: 'authenticated' }>,
) {
  if (authState.kind === 'unverified') {
    return NextResponse.json(
      { error: AUTH_ERROR_MESSAGES.emailNotVerified },
      { status: 403 },
    )
  }

  return NextResponse.json(
    { error: AUTH_ERROR_MESSAGES.unauthorized },
    { status: 401 },
  )
}
