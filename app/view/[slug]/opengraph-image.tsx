import { notFound } from 'next/navigation'
import { extractMarkdownSummary } from '@/lib/markdown-summary'
import { createOgImageResponse, OG_IMAGE_SIZE } from '@/lib/og-image-response'
import { getPublicFileBySlug } from '@/lib/public-files'
import { getRequestOrigin } from '@/lib/site-url'
import { headers } from 'next/headers'

interface ViewDocumentImageProps {
  params: Promise<{ slug: string }>
}

export const alt = 'Inkdown shared markdown document'
export const size = OG_IMAGE_SIZE
export const contentType = 'image/png'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function Image({ params }: ViewDocumentImageProps) {
  const { slug } = await params
  const file = await getPublicFileBySlug(slug)

  if (!file) {
    notFound()
  }

  const title = file.name.replace(/\.md$/, '')
  const preview = extractMarkdownSummary(file.content)
  const origin = getRequestOrigin(await headers())

  return createOgImageResponse({
    title,
    preview,
    username: file.username,
    isDoc: true,
    baseUrl: origin,
  })
}
