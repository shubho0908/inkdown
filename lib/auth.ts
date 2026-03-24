type AuthUser = {
  id: string
  email?: string | null
  email_confirmed_at?: string | null
  confirmed_at?: string | null
}

export type AnySupabaseClient = {
  auth: {
    getUser: () => Promise<{
      data: { user: AuthUser | null }
      error: unknown
    }>
  }
  from: (
    table: 'profiles',
  ) => {
    select: (columns: 'email_verified') => {
      eq: (
        column: 'user_id',
        value: string,
      ) => {
        maybeSingle: () => unknown
      }
    }
  }
}

export const AUTH_ERROR_MESSAGES = {
  unauthorized: 'Unauthorized',
  emailNotVerified: 'Please verify your email before signing in.',
} as const

export type VerifiedUserResult =
  | { kind: 'authenticated'; user: AuthUser }
  | { kind: 'unauthenticated' }
  | { kind: 'unverified'; user: AuthUser }

export function isUserEmailVerified(
  user: Partial<AuthUser> | null | undefined,
) {
  return Boolean(user?.email_confirmed_at ?? user?.confirmed_at)
}

export function isEmailVerificationError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()

  return (
    message.includes('email not confirmed') ||
    message.includes('email not verified') ||
    message.includes('confirm your email')
  )
}

export function getEmailVerificationRedirectPath(email?: string | null) {
  const searchParams = new URLSearchParams({
    reason: 'verify-email',
  })

  if (email) {
    searchParams.set('email', email)
  }

  return `/auth/sign-up-success?${searchParams.toString()}`
}

export async function requireVerifiedUser(
  supabase: unknown,
): Promise<VerifiedUserResult> {
  const client = supabase as AnySupabaseClient
  const {
    data: { user },
    error,
  } = await client.auth.getUser()

  if (error || !user) {
    return { kind: 'unauthenticated' }
  }

  if (!isUserEmailVerified(user)) {
    return { kind: 'unverified', user }
  }

  const profileResult = (await client
    .from('profiles')
    .select('email_verified')
    .eq('user_id', user.id)
    .maybeSingle()) as {
    data: { email_verified: boolean } | null
    error: unknown
  }

  const { data: profile, error: profileError } = profileResult

  if (profileError || !profile?.email_verified) {
    return { kind: 'unverified', user }
  }

  return { kind: 'authenticated', user }
}
