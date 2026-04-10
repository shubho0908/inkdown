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

function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  
  if (!origin && !referer) {
    return !isApiPath(request.nextUrl.pathname)
  }
  
  const checkUrl = origin || referer
  if (!checkUrl) return false
  
  try {
    const url = new URL(checkUrl)
    const hostname = url.hostname
    
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
    const isAllowedOrigin = ALLOWED_ORIGINS.some(allowed => 
      checkUrl === allowed || checkUrl.startsWith(allowed)
    )
    const isTrustedDomain = hostname.endsWith('inkdown.app') || 
                            hostname.endsWith('vercel.app') ||
                            hostname.endsWith('inkdown.vercel.app')
    
    return isLocalhost || isAllowedOrigin || isTrustedDomain
  } catch {
    return false
  }
}

function validateUserAgent(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  
  if (!userAgent && isApiPath(request.nextUrl.pathname)) {
    return false
  }
  
  const blockedPatterns = [
    /curl\/\d/i,
    /wget\/\d/i,
    /python-requests\//i,
    /axios\//i,
    /node-fetch/i,
    /postman/i,
    /insomnia/i,
    /httpie/i,
    /scrapy/i,
    /bot\//i,
    /crawler/i,
    /spider/i,
    /scan/i,
    /masscan/i,
    /nmap/i,
    /nikto/i,
  ]
  
  return !blockedPatterns.some(pattern => pattern.test(userAgent))
}

function validateClientToken(request: NextRequest): boolean {
  const clientToken = request.headers.get('x-client-token')
  const requestedWith = request.headers.get('x-requested-with')
  
  if (!clientToken || clientToken.length !== 32) {
    return false
  }
  
  if (requestedWith?.toLowerCase() !== 'xmlhttprequest') {
    return false
  }
  
  return /^[a-f0-9]{32}$/.test(clientToken)
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
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Token, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    })
  }
  
  if (isApiPath(pathname)) {
    if (!validateOrigin(request)) {
      console.warn(`[SECURITY] API request from invalid origin: ${pathname}`)
      return new NextResponse(
        JSON.stringify({ error: 'Invalid origin' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    if (!validateUserAgent(request)) {
      console.warn(`[SECURITY] API request with suspicious user agent: ${pathname}`)
      return new NextResponse(
        JSON.stringify({ error: 'Invalid user agent' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    if (!validateClientToken(request)) {
      console.warn(`[SECURITY] API request with invalid client token: ${pathname}`)
      return new NextResponse(
        JSON.stringify({ error: 'Invalid client token' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
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
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
