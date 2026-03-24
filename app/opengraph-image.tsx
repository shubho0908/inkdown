import { ImageResponse } from 'next/og'
import { OgCard } from '@/lib/og-card'
import { getOgFonts } from '@/lib/og-fonts'
import { getOgBaseUrl } from '@/lib/og-shared'

export const runtime = 'edge'
export const alt = 'Inkdown - Create, organize, and share markdown documents'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const fonts = await getOgFonts()

  return new ImageResponse(
    (
      <OgCard
        title={'Your markdown,\nbeautifully organized.'}
        baseUrl={getOgBaseUrl()}
      />
    ),
    {
      ...size,
      fonts,
    },
  )
}
