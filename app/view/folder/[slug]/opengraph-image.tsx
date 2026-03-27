import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { createOgImageResponse, OG_IMAGE_SIZE } from '@/lib/og-image-response'
import { getPublicFolderTreeBySlug } from '@/lib/public-folders'
import { getRequestOrigin } from '@/lib/site-url'

interface ViewFolderImageProps {
  params: Promise<{ slug: string }>
}

export const alt = 'Inkdown shared folder'
export const size = OG_IMAGE_SIZE
export const contentType = 'image/png'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function Image({ params }: ViewFolderImageProps) {
  const { slug } = await params
  const folder = await getPublicFolderTreeBySlug(slug)

  if (!folder) {
    notFound()
  }

  const requestHeaders = await headers()
  const requestOrigin = getRequestOrigin(requestHeaders)
  const subfolderCount = Math.max(folder.folders.length - 1, 0)
  const preview = `${folder.files.length} ${folder.files.length === 1 ? 'file' : 'files'} · ${subfolderCount} ${subfolderCount === 1 ? 'subfolder' : 'subfolders'}`

  return createOgImageResponse({
    title: folder.folder.name,
    preview,
    username: folder.folder.username,
    baseUrl: requestOrigin,
  })
}
