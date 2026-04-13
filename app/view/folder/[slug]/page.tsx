import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SharedFolderViewer } from '@/components/shared-folder-viewer'
import { Button } from '@/components/ui/button'
import { InkdownLogo } from '@/components/inkdown-logo'
import { JsonLd } from '@/components/json-ld'
import { ThemeToggle } from '@/components/theme-toggle'
import { getPublicFolderBySlug, getPublicFolderFileById, getPublicFolderTreeBySlug } from '@/lib/public-folders'
import { createSocialImageSet } from '@/lib/social-metadata'
import { createSiteUrl, getSiteUrl, getSiteUrlObject } from '@/lib/site-url'
import type { TreeItem } from '@/lib/types'
import { notFound } from 'next/navigation'

interface SharedFolderPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ file?: string }>
}

function findFirstFileId(items: TreeItem[]): string | null {
  for (const item of items) {
    if (item.type === 'file') {
      return item.id
    }

    const nestedFileId = item.children ? findFirstFileId(item.children) : null
    if (nestedFileId) {
      return nestedFileId
    }
  }

  return null
}

export async function generateMetadata({
  params,
}: SharedFolderPageProps): Promise<Metadata> {
  const { slug } = await params
  const folder = await getPublicFolderBySlug(slug)

  if (!folder) {
    return { title: 'Not Found' }
  }

  const documentUrl = createSiteUrl(`/view/folder/${slug}`).toString()
  const description = `Browse the shared folder "${folder.name}" on Inkdown.`
  const socialImageAlt = `Preview of the shared folder "${folder.name}" on Inkdown`
  const socialImages = createSocialImageSet(
    `/view/folder/${slug}`,
    socialImageAlt,
  )

  return {
    title: folder.name,
    description,
    metadataBase: getSiteUrlObject(),
    alternates: {
      canonical: documentUrl,
    },
    openGraph: {
      title: folder.name,
      description,
      type: 'website',
      locale: 'en_US',
      siteName: 'Inkdown',
      url: documentUrl,
      images: socialImages.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title: folder.name,
      description,
      images: socialImages.twitter,
    },
  }
}

export default async function SharedFolderPage({
  params,
  searchParams,
}: SharedFolderPageProps) {
  const { slug } = await params
  const { file: requestedFileId } = await searchParams

  const sharedFolder = await getPublicFolderTreeBySlug(slug)

  if (!sharedFolder) {
    notFound()
  }

  const fallbackFileId = findFirstFileId(sharedFolder.treeItems)
  const selectedFileId = requestedFileId || fallbackFileId
  let selectedFile = selectedFileId
    ? await getPublicFolderFileById(slug, selectedFileId)
    : null

  if (!selectedFile && requestedFileId && fallbackFileId && fallbackFileId !== requestedFileId) {
    selectedFile = await getPublicFolderFileById(slug, fallbackFileId)
  }

  const siteUrl = getSiteUrl()
  const folderUrl = createSiteUrl(`/view/folder/${slug}`).toString()
  const subfolderCount = Math.max(sharedFolder.folders.length - 1, 0)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: sharedFolder.folder.name,
    description: `Browse the shared folder "${sharedFolder.folder.name}" on Inkdown.`,
    url: folderUrl,
    datePublished: sharedFolder.folder.created_at,
    dateModified: sharedFolder.folder.updated_at,
    publisher: {
      '@type': 'Organization',
      name: 'Inkdown',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: createSiteUrl('/favicon.png').toString(),
      },
    },
  }

  return (
    <div className="min-h-svh bg-background">
      <JsonLd id="public-folder-structured-data" data={structuredData} />
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/">
            <InkdownLogo size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" asChild className="shrink-0">
              <Link href="/auth/sign-up">
                Start writing
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <SharedFolderViewer
        shareSlug={slug}
        folderName={sharedFolder.folder.name}
        filesCount={sharedFolder.files.length}
        subfolderCount={subfolderCount}
        treeItems={sharedFolder.treeItems}
        initialFile={selectedFile}
        fallbackFileId={fallbackFileId}
      />
    </div>
  )
}
