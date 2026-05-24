import { extractMarkdownSummary } from "@/lib/markdown-summary";
import { createOgImageResponse, OG_IMAGE_SIZE } from "@/lib/og-image-response";
import { getPublicFileBySlug } from "@/lib/public-files";
import { getSiteUrl } from "@/lib/site-url";

export const alt = "Inkdown shared document preview";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";
export const runtime = "nodejs";
export const revalidate = 60;

interface ImageProps {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const file = await getPublicFileBySlug(slug);

  if (!file) {
    return createOgImageResponse({
      title: "Shared document",
      preview: "Open this Inkdown document.",
      isDoc: true,
      baseUrl: getSiteUrl(),
    });
  }

  const title = file.name.replace(/\.md$/i, "");
  const preview = extractMarkdownSummary(file.content);

  return createOgImageResponse({
    title,
    preview,
    username: file.username,
    isDoc: true,
    baseUrl: getSiteUrl(),
  });
}
