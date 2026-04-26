'use client'

import { createClient } from '@/lib/supabase/client'
import { ensureSessionPersistence } from '@/lib/supabase/persistence'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth/auth-shell'
import { fetchJson, ApiError } from '@/lib/api'
import { getAuthRedirectUrl } from '@/lib/site-url'
import { validatePassword, checkPasswordRequirements } from '@/lib/auth/password-validation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useCallback, useMemo } from 'react'

type SignupError = {
  type: 'email_exists' | 'validation' | 'network' | 'server' | 'unknown'
  message: string
  action?: 'login' | 'retry' | 'contact'
}

async function checkEmailExists(email: string): Promise<{ exists: boolean; error?: SignupError }> {
  try {
    const data = await fetchJson<{ exists: boolean }>('/api/auth/check-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.toLowerCase().trim() }),
    })

    if (typeof data.exists !== 'boolean') {
      return {
        exists: false,
        error: {
          type: 'server',
          message: 'Unexpected server response. Please try again.',
          action: 'retry',
        },
      }
    }

    return { exists: data.exists }
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) {
        return {
          exists: false,
          error: {
            type: 'server',
            message: 'Too many attempts. Please wait a moment and try again.',
            action: 'retry',
          },
        }
      }

      if (error.status >= 500) {
        return {
          exists: false,
          error: {
            type: 'server',
            message: 'Server error. Please try again in a few moments.',
            action: 'retry',
          },
        }
      }

      return {
        exists: false,
        error: {
          type: 'network',
          message: error.message || 'Unable to verify email. Please try again.',
          action: 'retry',
        },
      }
    }

    return {
      exists: false,
      error: {
        type: 'network',
        message: 'Connection error. Please check your internet and try again.',
        action: 'retry',
      },
    }
  }
}


function validateEmail(email: string): { valid: boolean; error?: string } {
  const normalizedEmail = email.toLowerCase().trim()
  
  if (!normalizedEmail) {
    return { valid: false, error: 'Email is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(normalizedEmail)) {
    return { valid: false, error: 'Please enter a valid email address' }
  }

  const commonTypos = ['gmil.com', 'gmal.com', 'gmail.co', 'gmail.con', 'yahoo.co', 'hotmal.com']
  const domain = normalizedEmail.split('@')[1]
  if (domain && commonTypos.includes(domain)) {
    return { 
      valid: false, 
      error: `Did you mean ${normalizedEmail.replace(domain, domain.replace(/o/g, 'o').replace(/mal/g, 'mail'))}?` 
    }
  }

  return { valid: true }
}

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<SignupError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailChecked, setEmailChecked] = useState(false)
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false)
  const router = useRouter()
  const passwordValidation = useMemo(() => {
    if (password.length === 0) {
      return {
        strength: null as 'weak' | 'fair' | 'good' | 'strong' | null,
        errors: [] as string[],
        requirements: [] as ReturnType<typeof checkPasswordRequirements>,
      }
    }

    const result = validatePassword(password, email)
    const requirements = checkPasswordRequirements(password, email)

    return {
      strength: result.valid ? result.strength : null,
      errors: result.valid ? [] : [result.error],
      requirements,
    }
  }, [password, email])
  const passwordStrength = passwordValidation.strength
  const validationErrors = passwordValidation.errors

  const handleSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsLoading(true)
    setError(null)
    setEmailChecked(false)

    const supabase = createClient()

    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      setError({
        type: 'validation',
        message: emailValidation.error!,
      })
      setIsLoading(false)
      return
    }

    if (password !== repeatPassword) {
      setError({
        type: 'validation',
        message: 'Passwords do not match',
      })
      setIsLoading(false)
      return
    }

    const passwordValidation = validatePassword(password, email)
    if (!passwordValidation.valid) {
      setError({
        type: 'validation',
        message: passwordValidation.error,
      })
      setIsLoading(false)
      return
    }

    try {
      const { exists, error: checkError } = await checkEmailExists(email)
      
      if (checkError) {
        setError(checkError)
        setIsLoading(false)
        return
      }

      setEmailChecked(true)

      if (exists) {
        setError({
          type: 'email_exists',
          message: 'An account with this email already exists. Please sign in instead.',
          action: 'login',
        })
        setIsLoading(false)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          emailRedirectTo: getAuthRedirectUrl(
            '/auth/callback',
            window.location.origin,
          ),
        },
      })

      if (signUpError) {
        if (signUpError.message?.includes('already registered') ||
            signUpError.message?.includes('already exists') ||
            signUpError.message?.includes('already taken')) {
          setError({
            type: 'email_exists',
            message: 'An account with this email already exists. Please sign in instead.',
            action: 'login',
          })
        } else if (signUpError.code === 'over_email_send_rate_limit' ||
                   signUpError.message?.includes('rate limit') ||
                   signUpError.message?.includes('too many requests')) {
          setError({
            type: 'server',
            message: 'Too many signup attempts. Please wait a few minutes before trying again.',
            action: 'retry',
          })
        } else {
          setError({
            type: 'unknown',
            message: signUpError.message || 'Failed to create account. Please try again.',
            action: 'retry',
          })
        }
        setIsLoading(false)
        return
      }

      if (data.user) {
        if (data.session === null) {
          router.push(`/auth/sign-up-success?email=${encodeURIComponent(email)}`)
        } else {
          await ensureSessionPersistence(supabase)
          window.location.replace('/workspace')
        }
      } else {
        setError({
          type: 'unknown',
          message: 'Something unexpected happened. Please try again.',
          action: 'retry',
        })
        setIsLoading(false)
      }

    } catch (error: unknown) {
      setError({
        type: 'unknown',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        action: 'retry',
      })
      setIsLoading(false)
    }
  }, [email, password, repeatPassword, router])

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

  const renderError = () => {
    if (!error) return null

    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive font-medium">
          {error.message}
        </p>
        {error.action === 'login' && (
          <Link
            href="/auth/login"
            className="mt-2 inline-block text-sm text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Sign in here
          </Link>
        )}
      </div>
    )
  }

  return (
    <AuthShell
      title="Create an account"
      description="Join the ultimate markdown workspace"
    >
      <form onSubmit={handleSignUp}>
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
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setShowPasswordRequirements(e.target.value.length > 0)
              }}
              onFocus={() => password.length > 0 && setShowPasswordRequirements(true)}
              onBlur={() => !error && setShowPasswordRequirements(false)}
              disabled={isLoading}
              autoComplete="new-password"
              minLength={12}
            />
            {password && (
              <div className="space-y-2">
                {passwordStrength && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {getStrengthText()}
                    </span>
                  </div>
                )}
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
            <Label htmlFor="repeat-password">Confirm Password</Label>
            <Input
              id="repeat-password"
              type="password"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>
          
          {renderError()}
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !passwordStrength || passwordStrength === 'weak'}
          >
            {isLoading ? (
              emailChecked ? 'Creating account...' : 'Checking...'
            ) : (
              'Sign up'
            )}
          </Button>
        </div>
        <div className="mt-4">
          {(showPasswordRequirements || error?.type === 'validation') && password.length > 0 && (
            <div className="space-y-1">
              {passwordValidation.requirements.filter(req => !req.met).map((req, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <svg className="w-3 h-3 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  {req.label}
                </div>
              ))}
              {passwordValidation.requirements.filter(req => req.met).length > 0 && passwordValidation.requirements.filter(req => !req.met).length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {passwordValidation.requirements.filter(req => req.met).length} requirement{passwordValidation.requirements.filter(req => req.met).length > 1 ? 's' : ''} met
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
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
