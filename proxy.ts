import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL,
  'http://localhost:3000',
  'https://localhost:3000',
].filter(Boolean) as string[]

const BLOCKED_PATHS = [
  '/.env',
  '/.git',
  '/.github',
  '/config',
  '/wp-admin',
  '/wp-login',
  '/admin',
  '/phpmyadmin',
  '/api/keys',
  '/api/secrets',
]

const API_RATE_LIMIT_PATHS = [
  '/api/export',
  '/api/files',
  '/api/folders',
]

interface RateLimitInfo {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitInfo>()

function isBlockedPath(path: string): boolean {
  return BLOCKED_PATHS.some(blocked => 
    path.toLowerCase().startsWith(blocked) || 
    path.includes(blocked)
  )
}

function isApiPath(path: string): boolean {
  return path.startsWith('/api/')
}

function isApiRateLimited(path: string): boolean {
  return API_RATE_LIMIT_PATHS.some(apiPath => path.startsWith(apiPath))
}

function checkGlobalRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const windowMs = 60000
  const maxRequests = 100
  
  const entry = rateLimitMap.get(identifier)
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { allowed: true }
  }
  
  if (entry.count >= maxRequests) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    }
  }
  
  entry.count++
  return { allowed: true }
}

function getSecurityHeaders(): Record<string, string> {
  return {
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()',
    'X-XSS-Protection': '1; mode=block',
    'X-Robots-Tag': 'noindex, nofollow',
  }
}

function isSafeMethod(method: string): boolean {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS'
}

function isAllowedOrigin(url: URL, request: NextRequest): boolean {
  if (url.origin === request.nextUrl.origin) {
    return true
  }

  return ALLOWED_ORIGINS.includes(url.origin)
}

function validateMutationOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const source = origin || referer

  if (!source) {
    return false
  }

  try {
    return isAllowedOrigin(new URL(source), request)
  } catch {
    return false
  }
}

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown'
  
  return `${ip}:${request.nextUrl.pathname}`
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  if (isBlockedPath(pathname)) {
    console.warn(`[SECURITY] Blocked suspicious path: ${pathname}`)
    return new NextResponse('Not Found', { status: 404 })
  }
  
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin')
    const allowOrigin = (() => {
      if (!origin) {
        return request.nextUrl.origin
      }

      try {
        return isAllowedOrigin(new URL(origin), request)
          ? origin
          : 'null'
      } catch {
        return 'null'
      }
    })()

    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      },
    })
  }
  
  if (isApiPath(pathname)) {
    // Keep internal API contracts browser-native. Route handlers own auth/authorization,
    // while the proxy only applies lightweight edge checks that do not require custom headers.
    if (!isSafeMethod(request.method) && !validateMutationOrigin(request)) {
      console.warn(`[SECURITY] API mutation from invalid origin: ${pathname}`)
      return new NextResponse(
        JSON.stringify({ error: 'Invalid origin' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    if (isApiRateLimited(pathname)) {
      const clientId = getClientIdentifier(request)
      const rateLimit = checkGlobalRateLimit(clientId)
      
      if (!rateLimit.allowed) {
        console.warn(`[SECURITY] Rate limit exceeded: ${clientId}`)
        return new NextResponse(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { 
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(rateLimit.retryAfter),
            }
          }
        )
      }
    }
  }
  
  const response = await updateSession(request)
  
  const securityHeaders = getSecurityHeaders()
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      if (isAllowedOrigin(new URL(origin), request)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        response.headers.set('Vary', 'Origin')
      }
    } catch {
      // Ignore malformed origins.
    }
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
