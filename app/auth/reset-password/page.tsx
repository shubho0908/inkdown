import {
  ResetPasswordForm,
  type ResetPasswordIssue,
} from '@/components/auth/reset-password-form'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reset Password',
  robots: {
    index: false,
    follow: false,
  },
}

function getSafeResetPasswordIssue(
  issue: string | undefined,
): ResetPasswordIssue | null {
  if (
    issue === 'expired' ||
    issue === 'invalid' ||
    issue === 'missing_session' ||
    issue === 'validation_failed'
  ) {
    return issue
  }

  return null
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string
    token_hash?: string
    type?: string
    error?: string
    issue?: string
  }>
}) {
  const { code, token_hash, type, error, issue } = await searchParams

  return (
    <ResetPasswordForm
      initialError={error?.slice(0, 300) ?? null}
      initialIssue={getSafeResetPasswordIssue(issue)}
      recoveryCode={code ?? null}
      recoveryTokenHash={type === 'recovery' ? token_hash ?? null : null}
    />
  )
}
