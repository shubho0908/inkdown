import {
  ResetPasswordForm,
  type ResetPasswordIssue,
} from '@/components/auth/reset-password-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reset Password',
  robots: {
    index: false,
    follow: false,
  },
}

type SupabaseAuthError = {
  code?: string
  message?: string
  status?: number
}

function getResetPasswordIssue(error: SupabaseAuthError): ResetPasswordIssue {
  const code = error.code?.toLowerCase() ?? ''
  const message = error.message?.toLowerCase() ?? ''

  if (
    code.includes('expired') ||
    message.includes('expired') ||
    message.includes('otp has expired')
  ) {
    return 'expired'
  }

  if (
    code.includes('invalid') ||
    message.includes('invalid') ||
    message.includes('already') ||
    message.includes('used')
  ) {
    return 'invalid'
  }

  return 'validation_failed'
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  let initialError: string | null = null
  let initialIssue: ResetPasswordIssue | null = null

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      initialIssue = getResetPasswordIssue(error)
      initialError =
        error.message || 'Invalid or expired reset link. Please request a new password reset.'
    } else {
      redirect('/auth/reset-password')
    }
  }

  return (
    <ResetPasswordForm
      initialError={initialError}
      initialIssue={initialIssue}
    />
  )
}
