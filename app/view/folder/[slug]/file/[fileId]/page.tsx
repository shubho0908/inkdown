import type { Metadata } from "next";
import { SharedFolderPageContent } from "@/components/shared-folder-page-content";
import { extractMarkdownSummary } from "@/lib/markdown-summary";
import { getPublicFolderBySlug, getPublicFolderFileById } from "@/lib/db/public-folders";
import { createSiteUrl, getSiteUrlObject } from "@/lib/site-url";
import { createSocialImageSet } from "@/lib/social-metadata";

interface SharedFolderFilePageProps {
  params: Promise<{ slug: string; fileId: string }>;
}

export const revalidate = 60;
export const dynamicParams = true;

export async function generateMetadata({ params }: SharedFolderFilePageProps): Promise<Metadata> {
  const { slug, fileId } = await params;
  const [folder, file] = await Promise.all([
    getPublicFolderBySlug(slug),
    getPublicFolderFileById(slug, fileId),
  ]);

  if (!folder || !file) {
    return { title: "Not Found" };
  }

  const title = file.name.replace(/\.md$/, "");
  const description = extractMarkdownSummary(file.content, {
    fallback: `Read "${title}" from the shared folder "${folder.name}" on Inkdown.`,
    maxLength: 155,
  });
  const pageUrl = createSiteUrl(`/view/folder/${slug}/file/${fileId}`).toString();
  const socialImages = createSocialImageSet(
    `/view/folder/${slug}`,
    `Inkdown shared folder preview for ${folder.name}`,
  );

  return {
    title: `${title} - ${folder.name}`,
    description,
    metadataBase: getSiteUrlObject(),
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${title} - ${folder.name}`,
      description,
      type: "article",
      locale: "en_US",
      siteName: "Inkdown",
      url: pageUrl,
      publishedTime: file.created_at,
      modifiedTime: file.updated_at,
      images: socialImages.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - ${folder.name}`,
      description,
      images: socialImages.twitter,
    },
  };
}

export default async function SharedFolderFilePage({ params }: SharedFolderFilePageProps) {
  const { slug, fileId } = await params;
  return <SharedFolderPageContent slug={slug} requestedFileId={fileId} />;
}
