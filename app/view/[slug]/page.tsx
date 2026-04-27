import { MarkdownPreview } from '@/components/markdown-preview'
import { Button } from '@/components/ui/button'
import { InkdownLogo } from '@/components/inkdown-logo'
import { JsonLd } from '@/components/json-ld'
import { SharedCopyButton } from '@/components/shared-copy-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { extractMarkdownSummary } from '@/lib/markdown-summary'
import { getPublicFileBySlug } from '@/lib/public-files'
import { createSocialImageSet } from '@/lib/social-metadata'
import { createSiteUrl, getSiteUrl, getSiteUrlObject } from '@/lib/site-url'

interface ViewPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ViewPageProps): Promise<Metadata> {
  const { slug } = await params
  const file = await getPublicFileBySlug(slug)

  if (!file) {
    return { title: 'Not Found' }
  }

  const title = file.name.replace(/\.md$/, '')
  const description = extractMarkdownSummary(file.content, {
    fallback: `Read "${title}" on Inkdown`,
  })
  const documentUrl = createSiteUrl(`/view/${slug}`).toString()
  const socialImageAlt = `Preview of "${title}" shared on Inkdown`
  const socialImages = createSocialImageSet(
    `/view/${slug}`,
    socialImageAlt,
  )

  return {
    title,
    description,
    metadataBase: getSiteUrlObject(),
    authors: file.username ? [{ name: file.username }] : undefined,
    alternates: {
      canonical: documentUrl,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      locale: 'en_US',
      siteName: 'Inkdown',
      url: documentUrl,
      publishedTime: file.created_at,
      modifiedTime: file.updated_at,
      authors: file.username ? [file.username] : undefined,
      images: socialImages.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: socialImages.twitter,
    },
  }
}

export default async function ViewPage({ params }: ViewPageProps) {
  const { slug } = await params
  const file = await getPublicFileBySlug(slug)

  if (!file) {
    notFound()
  }

  const title = file.name.replace(/\.md$/, '')
  const description = extractMarkdownSummary(file.content, {
    fallback: `Read "${title}" on Inkdown`,
  })
  const updatedAt = new Date(file.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const siteUrl = getSiteUrl()
  const documentUrl = createSiteUrl(`/view/${slug}`).toString()
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: title,
    description,
    url: documentUrl,
    datePublished: file.created_at,
    dateModified: file.updated_at,
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
      <JsonLd id="public-file-structured-data" data={structuredData} />
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
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

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <article>
          <header className="mb-8 border-b pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Last updated on {updatedAt}
                </p>
              </div>
              <SharedCopyButton
                shareSlug={slug}
                itemName={file.name}
                itemType="file"
                label="full"
                className="w-full shrink-0 sm:w-auto"
              />
            </div>
          </header>
          <MarkdownPreview content={file.content} />
        </article>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-4xl px-4 text-center text-sm text-muted-foreground sm:px-6">
          <p>
            Shared via{' '}
            <Link href="/" className="text-primary underline underline-offset-4 hover:text-primary/80">
              Inkdown
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
