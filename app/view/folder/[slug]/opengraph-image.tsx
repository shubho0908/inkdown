import { createOgImageResponse, OG_IMAGE_SIZE } from "@/lib/og-image-response";
import { getPublicFolderBySlug } from "@/lib/public-folders";
import { getSiteUrl } from "@/lib/site-url";

export const alt = "Inkdown shared folder preview";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";
export const runtime = "nodejs";
export const revalidate = 60;

interface ImageProps {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const folder = await getPublicFolderBySlug(slug);

  if (!folder) {
    return createOgImageResponse({
      title: "Shared folder",
      preview: "Browse this Inkdown folder.",
      isDoc: true,
      baseUrl: getSiteUrl(),
    });
  }

  return createOgImageResponse({
    title: folder.name,
    preview: `Browse the shared folder "${folder.name}" on Inkdown.`,
    username: folder.username,
    isDoc: true,
    baseUrl: getSiteUrl(),
  });
}
