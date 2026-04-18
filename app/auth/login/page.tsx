import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'
import {
  getEmailVerificationRedirectPath,
  requireVerifiedUser,
} from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Inkdown account to access your markdown workspace.',
  robots: { index: false },
}

export default async function LoginPage() {
  const supabase = await createClient()
  const authState = await requireVerifiedUser(supabase)

  if (authState.kind === 'authenticated') {
    redirect('/workspace')
  }

  if (authState.kind === 'unverified') {
    redirect(getEmailVerificationRedirectPath(authState.user.email))
  }

  return <LoginForm />
}
