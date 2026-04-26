'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth/auth-shell'
import { createClient } from '@/lib/supabase/client'
import { ensureSessionPersistence } from '@/lib/supabase/persistence'
import { isUserEmailVerified } from '@/lib/auth'
import { validatePassword, getPasswordRequirements } from '@/lib/auth/password-validation'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export type ResetPasswordIssue =
  | 'expired'
  | 'invalid'
  | 'missing_session'
  | 'validation_failed'

type ResetPasswordIssueCopy = {
  title: string
  description: string
  heading: string
  message: string
  tone: 'amber' | 'destructive'
}

const RESET_PASSWORD_ISSUE_COPY: Record<
  ResetPasswordIssue,
  ResetPasswordIssueCopy
> = {
  expired: {
    title: 'Link Expired',
    description: 'Your password reset link has expired',
    heading: 'Reset link expired',
    message:
      'Password reset links are time-limited. Request a new link and use the newest email you receive.',
    tone: 'amber',
  },
  invalid: {
    title: 'Invalid Link',
    description: 'This password reset link cannot be used',
    heading: 'Reset link invalid',
    message:
      'This link may be malformed, already used, or from an older reset request. Request a fresh link to continue.',
    tone: 'destructive',
  },
  missing_session: {
    title: 'Reset Session Missing',
    description: 'Open your password reset link from your email',
    heading: 'No active reset session',
    message:
      'This page only works after opening a valid password reset email. Request a new link if you do not have one.',
    tone: 'destructive',
  },
  validation_failed: {
    title: 'Reset Link Problem',
    description: 'We could not validate your reset link',
    heading: 'Reset link could not be validated',
    message:
      'Something went wrong while checking this reset link. Request a new link and try again.',
    tone: 'destructive',
  },
}

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

type ResetPasswordFormProps = {
  initialError?: string | null
  initialIssue?: ResetPasswordIssue | null
}

export function ResetPasswordForm({
  initialError = null,
  initialIssue = null,
}: ResetPasswordFormProps) {
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(initialError)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'fair' | 'good' | 'strong' | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isValidatingToken, setIsValidatingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [resetIssue, setResetIssue] = useState<ResetPasswordIssue | null>(
    initialIssue,
  )

  useEffect(() => {
    if (initialError || initialIssue) {
      setResetIssue(initialIssue ?? 'validation_failed')
      setIsValidatingToken(false)
      return
    }

    const supabase = createClient()

    supabase.auth.getUser()
    .then(({ data, error }) => {
      if (error || !data.user) {
        setResetIssue('missing_session')
        setError('No active password reset session found.')
        setTokenValid(false)
      } else {
        setTokenValid(true)
      }
    })
    .catch(() => {
      setResetIssue('validation_failed')
      setError('Failed to validate reset link. Please try again.')
      setTokenValid(false)
    })
    .finally(() => {
      setIsValidatingToken(false)
    })
  }, [initialError, initialIssue])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!tokenValid) {
      setError('Invalid reset link. Please request a new password reset.')
      return
    }
    
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setValidationErrors([])

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      setError(passwordValidation.error)
      setIsLoading(false)
      return
    }

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        throw updateError
      }

      if (!data.user) {
        throw new Error('Failed to update password')
      }

      if (!isUserEmailVerified(data.user)) {
        const hasVerifiedProfile = await isProfileEmailVerified(
          supabase,
          data.user.id,
        )

        if (!hasVerifiedProfile) {
          await supabase.auth.signOut()
          setError('Your email is not verified. Please verify your email first.')
          setIsLoading(false)
          return
        }
      }

      await ensureSessionPersistence(supabase)
      window.location.replace('/workspace')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (password.length === 0) {
      setPasswordStrength(null)
      setValidationErrors([])
      return
    }

    const result = validatePassword(password)
    if (result.valid) {
      setPasswordStrength(result.strength)
      setValidationErrors([])
    } else {
      setPasswordStrength(null)
      setValidationErrors([result.error])
    }
  }, [password])

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return 'bg-red-500'
      case 'fair': return 'bg-orange-500'
      case 'good': return 'bg-yellow-500'
      case 'strong': return 'bg-green-500'
      default: return 'bg-gray-200'
    }
  }

  const getStrengthText = () => {
    switch (passwordStrength) {
      case 'weak': return 'Weak'
      case 'fair': return 'Fair'
      case 'good': return 'Good'
      case 'strong': return 'Strong'
      default: return ''
    }
  }

  if (isValidatingToken) {
    return (
      <AuthShell
        title="Validating..."
        description="Please wait while we validate your reset link"
      >
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AuthShell>
    )
  }

  if (!tokenValid) {
    const issueCopy =
      RESET_PASSWORD_ISSUE_COPY[resetIssue ?? 'validation_failed']
    const issueClasses =
      issueCopy.tone === 'amber'
        ? {
            container:
              'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
            icon: 'text-amber-600 dark:text-amber-400',
            heading: 'text-amber-800 dark:text-amber-200',
            message: 'text-amber-700 dark:text-amber-300',
          }
        : {
            container:
              'bg-destructive/10 border-destructive/20 dark:bg-destructive/10 dark:border-destructive/30',
            icon: 'text-destructive',
            heading: 'text-destructive',
            message: 'text-muted-foreground',
          }

    return (
      <AuthShell
        title={issueCopy.title}
        description={issueCopy.description}
      >
        <div className="flex flex-col gap-4">
          <div className={`border rounded-lg p-4 ${issueClasses.container}`}>
            <div className="flex items-start gap-3">
              <svg
                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${issueClasses.icon}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <p className={`text-sm font-medium ${issueClasses.heading}`}>
                  {issueCopy.heading}
                </p>
                <p className={`text-xs mt-1 ${issueClasses.message}`}>
                  {issueCopy.message}
                </p>
              </div>
            </div>
          </div>
          {error ? (
            <p className="text-xs text-muted-foreground text-center break-words">
              {error}
            </p>
          ) : null}
          <Link href="/auth/forgot-password" className="w-full">
            <Button variant="outline" className="w-full">
              Request New Reset Link
            </Button>
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Set new password"
      description="Enter your new password below"
    >
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
              minLength={12}
            />
            {password && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{ width: passwordStrength ? '100%' : '0%' }}
                    />
                  </div>
                  {passwordStrength && (
                    <span className="text-xs font-medium text-muted-foreground">
                      {getStrengthText()}
                    </span>
                  )}
                </div>
                {validationErrors.length > 0 && (
                  <ul className="text-xs text-destructive space-y-1">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>• {err}</li>
                    ))}
                  </ul>
                )}
                {password.length > 0 && password.length < 12 && (
                  <p className="text-xs text-muted-foreground">
                    Minimum 12 characters required
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="repeat-password">Confirm New Password</Label>
            <Input
              id="repeat-password"
              type="password"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {repeatPassword && password !== repeatPassword && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !passwordStrength || passwordStrength === 'weak'}
          >
            {isLoading ? 'Updating...' : 'Update password'}
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Password requirements:</p>
          <ul className="text-xs text-muted-foreground space-y-1 pl-4">
            {getPasswordRequirements().map((req, idx) => (
              <li key={idx}>• {req}</li>
            ))}
          </ul>
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link
            href="/auth/login"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  )
}
