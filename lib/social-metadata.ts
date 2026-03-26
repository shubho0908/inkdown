import { OG_IMAGE_SIZE } from '@/lib/og-image-response'
import { createSiteUrl } from '@/lib/site-url'

type SocialImageKind = 'opengraph-image' | 'twitter-image'

function normalizeRoutePath(routePath: string) {
  const segments = routePath
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))

  return segments.length > 0 ? `/${segments.join('/')}` : ''
}

function createSocialImage(routePath: string, kind: SocialImageKind, alt: string) {
  const normalizedRoutePath = normalizeRoutePath(routePath)

  return {
    url: createSiteUrl(`${normalizedRoutePath}/${kind}`).toString(),
    width: OG_IMAGE_SIZE.width,
    height: OG_IMAGE_SIZE.height,
    alt,
  }
}

export function createSocialImageSet(routePath: string, alt: string) {
  return {
    openGraph: [createSocialImage(routePath, 'opengraph-image', alt)],
    twitter: [createSocialImage(routePath, 'twitter-image', alt)],
  }
}
