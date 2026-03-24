const FALLBACK_SITE_URL = 'https://inkdown.app'

function normalizeSiteUrl(url: string) {
  return url.replace(/\/$/, '')
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
