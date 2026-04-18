'use client'

import type { SupabaseClient, Session } from '@supabase/supabase-js'
import {
  AUTH_COOKIE_NAME,
  AUTH_PERSISTENCE_POLL_INTERVAL_MS,
  AUTH_PERSISTENCE_TIMEOUT_MS,
} from '@/lib/supabase/config'

function hasSupabaseAuthCookie() {
  return document.cookie
    .split(';')
    .some((entry) => entry.trimStart().startsWith(AUTH_COOKIE_NAME))
}

function sleep(delayMs: number) {
  return new Promise((resolve) => window.setTimeout(resolve, delayMs))
}

export async function ensureSessionPersistence(
  supabase: SupabaseClient,
  timeoutMs = AUTH_PERSISTENCE_TIMEOUT_MS,
): Promise<Session> {
  const deadline = Date.now() + timeoutMs
  let lastSession: Session | null = null

  while (Date.now() <= deadline) {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    lastSession = session

    if (session && hasSupabaseAuthCookie()) {
      return session
    }

    await sleep(AUTH_PERSISTENCE_POLL_INTERVAL_MS)
  }

  if (lastSession) {
    return lastSession
  }

  throw new Error(
    'Authentication succeeded but the session cookie was not persisted.',
  )
}
