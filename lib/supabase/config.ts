export const AUTH_COOKIE_NAME = 'inkdown-auth'
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

export const supabaseCookieOptions = {
  name: AUTH_COOKIE_NAME,
  path: '/',
  sameSite: 'lax' as const,
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
}

export const AUTH_PERSISTENCE_TIMEOUT_MS = 3_000
export const AUTH_PERSISTENCE_POLL_INTERVAL_MS = 100

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}
