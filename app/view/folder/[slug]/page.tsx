import type { Metadata } from "next";
import { SharedFolderPageContent } from "@/components/shared-folder-page-content";
import { getPublicFolderBySlug, listPublicFoldersForSitemap } from "@/lib/public-folders";
import { createSiteUrl, getSiteUrlObject } from "@/lib/site-url";
import { createSocialImageSet } from "@/lib/social-metadata";

interface SharedFolderPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const folders = await listPublicFoldersForSitemap();
    const params: { slug: string }[] = [];
    for (const folder of folders) {
      if (folder.slug) {
        params.push({ slug: folder.slug });
      }
    }
    return params;
  } catch (error) {
    console.warn("Shared folder static params lookup failed.", error);
    return [];
  }
}

export async function generateMetadata({ params }: SharedFolderPageProps): Promise<Metadata> {
  const { slug } = await params;
  const folder = await getPublicFolderBySlug(slug);

  if (!folder) {
    return { title: "Not Found" };
  }

  const documentUrl = createSiteUrl(`/view/folder/${slug}`).toString();
  const description = `Browse the shared folder "${folder.name}" on Inkdown.`;
  const socialImages = createSocialImageSet(
    `/view/folder/${slug}`,
    `Inkdown shared folder preview for ${folder.name}`,
  );

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
      type: "website",
      locale: "en_US",
      siteName: "Inkdown",
      url: documentUrl,
      images: socialImages.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title: folder.name,
      description,
      images: socialImages.twitter,
    },
  };
}

export default async function SharedFolderPage({ params }: SharedFolderPageProps) {
  const { slug } = await params;
  return <SharedFolderPageContent slug={slug} />;
}
