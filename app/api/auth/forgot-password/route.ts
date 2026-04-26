import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthRedirectUrl } from '@/lib/site-url'

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 3

function getRateLimitKey(identifier: string): string {
  return `forgot-password:${identifier}`
}

function checkRateLimit(identifier: string): { allowed: boolean; resetTime?: number } {
  const key = getRateLimitKey(identifier)
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    })
    return { allowed: true }
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, resetTime: record.resetTime }
  }

  record.count++
  return { allowed: true }
}

function getClientIdentifier(request: Request): string {
  const headers = request.headers
  const forwardedFor = headers.get('x-forwarded-for')
  const realIp = headers.get('x-real-ip')
  const cfConnectingIp = headers.get('cf-connecting-ip')
  
  if (cfConnectingIp) return cfConnectingIp
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  if (realIp) return realIp
  
  return 'unknown'
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  
  if (origin) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_SITE_URL].filter(Boolean)
    const isOriginAllowed = allowedOrigins.some(allowed => {
      if (!allowed) return false
      try {
        return new URL(origin).origin === new URL(allowed).origin
      } catch {
        return false
      }
    })
    
    if (process.env.NODE_ENV === 'production' && !isOriginAllowed) {
      return NextResponse.json(
        { error: 'Invalid origin' },
        { status: 403 },
      )
    }
  }
  
  const contentType = request.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    return NextResponse.json(
      { error: 'Invalid content type' },
      { status: 400 },
    )
  }

  const clientIdentifier = getClientIdentifier(request)
  const rateLimitResult = checkRateLimit(clientIdentifier)
  
  if (!rateLimitResult.allowed) {
    const resetTime = rateLimitResult.resetTime!
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(resetTime).toISOString(),
        },
      },
    )
  }

  try {
    let email: string
    try {
      const body = await request.json()
      email = body.email?.toLowerCase()?.trim()

      if (!email || typeof email !== 'string') {
        return NextResponse.json(
          { error: 'Email is required and must be a string' },
          { status: 400 },
        )
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 },
        )
      }
      
      if (email.length > 254) {
        return NextResponse.json(
          { error: 'Email is too long' },
          { status: 400 },
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      )
    }

    const supabase = await createClient()
    
    const resetRedirectUrl = getAuthRedirectUrl(
      '/auth/reset-password',
      request.headers.get('origin') ?? undefined,
    )

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetRedirectUrl,
    })

    if (resetError) {
      console.error('Password reset error:', resetError)
      const isEmailRateLimited =
        resetError.status === 429 ||
        resetError.code === 'over_email_send_rate_limit'

      if (isEmailRateLimited) {
        return NextResponse.json(
          { error: 'Too many reset emails sent. Please wait before trying again.' },
          {
            status: 429,
            headers: {
              'Retry-After': '60',
            },
          },
        )
      }

      return NextResponse.json(
        { error: 'Failed to send reset link. Please try again.' },
        { status: 500 },
      )
    }

    const response = NextResponse.json(
      { message: 'If an account with this email exists, a password reset link has been sent.' },
      { status: 200 },
    )
    
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    return response

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
