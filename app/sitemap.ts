import type { MetadataRoute } from 'next'
import { listPublicFilesForSitemap } from '@/lib/public-files'
import { createSiteUrl } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: createSiteUrl('/').toString(),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: createSiteUrl('/privacy').toString(),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: createSiteUrl('/terms').toString(),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  const publicFiles = await listPublicFilesForSitemap()
  const documentRoutes = publicFiles.map((file) => ({
    url: createSiteUrl(`/view/${file.slug}`).toString(),
    lastModified: new Date(file.updated_at || file.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...documentRoutes]
}
