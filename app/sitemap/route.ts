import { listPublicFoldersForSitemap } from "@/lib/public-folders";
import { listPublicFilesForSitemap } from "@/lib/public-files";
import { createSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: "weekly" | "yearly";
  priority: number;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderSitemap(entries: SitemapEntry[]) {
  const urls = entries
    .map(
      (entry) => `<url>
<loc>${escapeXml(entry.url)}</loc>
<lastmod>${entry.lastModified.toISOString()}</lastmod>
<changefreq>${entry.changeFrequency}</changefreq>
<priority>${entry.priority}</priority>
</url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const now = new Date();
  const staticRoutes: SitemapEntry[] = [
    {
      url: createSiteUrl("/").toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: createSiteUrl("/privacy").toString(),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: createSiteUrl("/terms").toString(),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  try {
    const [publicFiles, publicFolders] = await Promise.all([
      listPublicFilesForSitemap(),
      listPublicFoldersForSitemap(),
    ]);

    return [
      ...staticRoutes,
      ...publicFiles.map((file) => ({
        url: createSiteUrl(`/view/${file.slug}`).toString(),
        lastModified: new Date(file.updated_at || file.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...publicFolders.map((folder) => ({
        url: createSiteUrl(`/view/folder/${folder.slug}`).toString(),
        lastModified: new Date(folder.updated_at || folder.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch (error) {
    console.warn("Sitemap public share lookup failed; returning static sitemap.", error);
    return staticRoutes;
  }
}

export async function GET() {
  const entries = await getSitemapEntries();

  return new Response(renderSitemap(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
