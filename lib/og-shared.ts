import { getSiteUrl } from '@/lib/site-url'

let ogLogoUrlPromise: Promise<string> | null = null

function createFallbackLogoUrl() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" viewBox="0 0 112 112" fill="none">
      <rect width="112" height="112" rx="26" fill="#2563eb"/>
      <path d="M34 26h16v60H34zM56 26h22c8.837 0 16 7.163 16 16s-7.163 16-16 16H56V26zm0 44h16.5L89 86H71.5L56 70z" fill="#f8fafc"/>
    </svg>
  `.trim()

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function getLogoPath() {
  // Use process.cwd() for serverless compatibility (Vercel, etc.)
  const { resolve } = require('path')
  return resolve(process.cwd(), 'public/favicon.png')
}

export function getOgBaseUrl(origin?: string) {
  return getSiteUrl(origin)
}

export function getOgLogoUrl() {
  if (!ogLogoUrlPromise) {
    ogLogoUrlPromise = (async () => {
      try {
        const { readFile } = await import('node:fs/promises')
        const logoPath = getLogoPath()
        const icon = await readFile(logoPath)

        return `data:image/png;base64,${icon.toString('base64')}`
      } catch (error) {
        console.warn('OG logo loading failed, falling back to inline logo.', error)
        return createFallbackLogoUrl()
      }
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
