import { ImageResponse } from 'next/og'
import { OgCard } from '@/lib/og-card'
import { getOgFonts } from '@/lib/og-fonts'
import { getSiteUrl } from '@/lib/site-url'

export const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
} as const

interface CreateOgImageResponseOptions {
  title: string
  preview?: string
  username?: string | null
  isDoc?: boolean
  baseUrl?: string
}

export async function createOgImageResponse({
  title,
  preview = '',
  username,
  isDoc = false,
  baseUrl = getSiteUrl(),
}: CreateOgImageResponseOptions) {
  const fonts = await getOgFonts()

  return new ImageResponse(
    <OgCard
      title={title}
      preview={preview}
      username={username}
      isDoc={isDoc}
      baseUrl={baseUrl}
    />,
    {
      ...OG_IMAGE_SIZE,
      fonts,
    },
  )
}
