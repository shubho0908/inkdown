'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth/auth-shell'
import { fetchJson, ApiError } from '@/lib/api'
import Link from 'next/link'
import { useState } from 'react'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }

    try {
      await fetchJson('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })
      setSuccess(true)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 429) {
          setError('Too many attempts. Please wait a moment and try again.')
        } else if (error.status >= 500) {
          setError('Server error. Please try again in a few moments.')
        } else {
          setError(error.message || 'Failed to send reset link. Please try again.')
        }
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <AuthShell
        title="Check your email"
        description={"We've sent a password reset link to your email"}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground text-center">
            If an account with this email exists, you&apos;ll receive a password reset link shortly.
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setSuccess(false)
              setEmail('')
            }}
          >
            Send another link
          </Button>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link
              href="/auth/login"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Sign in
            </Link>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your email and we'll send you a reset link"
    >
      <form onSubmit={handleSubmit}>
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
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send reset link'}
          </Button>
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
