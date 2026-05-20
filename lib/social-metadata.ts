import { OG_IMAGE_SIZE } from '@/lib/og-image-response'
import { createSiteUrl } from '@/lib/site-url'

type SocialImageKind = 'opengraph-image' | 'twitter-image'

function normalizeRoutePath(routePath: string) {
  const segments: string[] = []

  for (const segment of routePath.split('/')) {
    if (segment) {
      segments.push(encodeURIComponent(segment))
    }
  }

  return segments.length > 0 ? `/${segments.join('/')}` : ''
}

function createSocialImage(
  routePath: string,
  kind: SocialImageKind,
  alt: string,
  origin?: string,
) {
  const normalizedRoutePath = normalizeRoutePath(routePath)

  return {
    url: createSiteUrl(`${normalizedRoutePath}/${kind}`, origin).toString(),
    width: OG_IMAGE_SIZE.width,
    height: OG_IMAGE_SIZE.height,
    alt,
  }
}

export function createSocialImageSet(routePath: string, alt: string, origin?: string) {
  return {
    openGraph: [createSocialImage(routePath, 'opengraph-image', alt, origin)],
    twitter: [createSocialImage(routePath, 'twitter-image', alt, origin)],
  }
}
