const FALLBACK_SITE_URL = 'https://inkdown.app'
const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1'])

function normalizeSiteUrl(url: string) {
  return url.replace(/\/$/, '')
}

function isLocalOrigin(origin: string) {
  return LOCALHOST_HOSTNAMES.has(new URL(origin).hostname)
}

export function getSiteUrl(origin?: string) {
  if (origin) {
    return normalizeSiteUrl(new URL('/', origin).toString())
  }

  return normalizeSiteUrl(
    process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      FALLBACK_SITE_URL,
  )
}

export function getSiteUrlObject(origin?: string) {
  return new URL(getSiteUrl(origin))
}

export function createSiteUrl(path = '/', origin?: string) {
  return new URL(path, `${getSiteUrl(origin)}/`)
}

export function getAuthRedirectUrl(path = '/auth/callback', origin?: string) {
  const developmentRedirectOrigin =
    process.env.NODE_ENV === 'development'
      ? process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
      : undefined

  if (origin && !isLocalOrigin(origin)) {
    return createSiteUrl(path, origin).toString()
  }

  if (developmentRedirectOrigin) {
    return createSiteUrl(path, developmentRedirectOrigin).toString()
  }

  return createSiteUrl(path).toString()
}
