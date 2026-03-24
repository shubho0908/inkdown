const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://inkdown.app'

export function getOgBaseUrl(origin?: string) {
  return origin ? new URL('/', origin).toString().replace(/\/$/, '') : DEFAULT_BASE_URL
}

export function getHostLabel(baseUrl: string) {
  return new URL(baseUrl).host.replace(/^www\./, '')
}

export function clampText(text: string, limit: number) {
  return text.length > limit ? `${text.slice(0, limit - 3)}...` : text
}
