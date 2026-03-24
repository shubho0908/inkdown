import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { OgCard } from '@/lib/og-card'
import { getOgFonts } from '@/lib/og-fonts'
import { getOgBaseUrl } from '@/lib/og-shared'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') ?? 'Untitled'
  const preview = searchParams.get('preview') ?? ''
  const isDoc = searchParams.get('doc') === '1'
  const baseUrl = getOgBaseUrl(request.nextUrl.origin)
  const fonts = await getOgFonts()

  return new ImageResponse(
    <OgCard title={title} preview={preview} isDoc={isDoc} baseUrl={baseUrl} />,
    {
      width: 1200,
      height: 630,
      fonts,
    },
  )
}
