'use client'

import {
  getEmailVerificationRedirectPath,
  isEmailVerificationError,
  isUserEmailVerified,
} from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { ensureSessionPersistence } from '@/lib/supabase/persistence'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth/auth-shell'
import Link from 'next/link'
import { useState } from 'react'

async function isProfileEmailVerified(
  supabase: ReturnType<typeof createClient>,
  userId: string,
) {
  const { data, error } = await supabase
    .from('profiles')
    .select('email_verified')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    return false
  }

  return Boolean(data?.email_verified)
}

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (isEmailVerificationError(error)) {
          window.location.replace(getEmailVerificationRedirectPath(email))
          return
        }

        throw error
      }

      if (!isUserEmailVerified(data.user)) {
        await supabase.auth.signOut()
        window.location.replace(
          getEmailVerificationRedirectPath(data.user?.email ?? email),
        )
        return
      }

      const hasVerifiedProfile = await isProfileEmailVerified(
        supabase,
        data.user.id,
      )

      if (!hasVerifiedProfile) {
        await supabase.auth.signOut()
        window.location.replace(
          getEmailVerificationRedirectPath(data.user?.email ?? email),
        )
        return
      }

      await ensureSessionPersistence(supabase)
      window.location.replace('/workspace')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to access your workspace"
    >
      <form onSubmit={handleLogin}>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-primary hover:underline underline-offset-4"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/sign-up"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Sign up
          </Link>
        </div>
      </form>
    </AuthShell>
  )
}
