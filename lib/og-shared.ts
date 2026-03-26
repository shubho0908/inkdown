import { getSiteUrl } from '@/lib/site-url'

let ogLogoUrlPromise: Promise<string> | null = null

export function getOgBaseUrl(origin?: string) {
  return getSiteUrl(origin)
}

export function getOgLogoUrl() {
  if (!ogLogoUrlPromise) {
    ogLogoUrlPromise = (async () => {
      const { readFile } = await import('node:fs/promises')
      const icon = await readFile(new URL('../public/favicon.png', import.meta.url))

      return `data:image/png;base64,${icon.toString('base64')}`
    })()
  }

  return ogLogoUrlPromise
}

export function getHostLabel(baseUrl: string) {
  return new URL(baseUrl).host.replace(/^www\./, '')
}

export function clampText(text: string, limit: number) {
  const normalized = text.trim()

  if (normalized.length <= limit) {
    return normalized
  }

  const clipped = normalized.slice(0, limit + 1)
  const wordBoundary = clipped.lastIndexOf(' ')

  if (wordBoundary >= Math.floor(limit * 0.6)) {
    return `${clipped.slice(0, wordBoundary).trim()}...`
  }

  return `${normalized.slice(0, limit - 3).trim()}...`
}
