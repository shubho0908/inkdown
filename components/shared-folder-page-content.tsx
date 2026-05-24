import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SharedFolderViewer } from "@/components/shared-folder-viewer";
import { InkdownLogo } from "@/components/inkdown-logo";
import { JsonLd } from "@/components/json-ld";
import { ThemeToggle } from "@/components/theme-toggle";
import { getPublicFolderFileById, getPublicFolderTreeBySlug } from "@/lib/public-folders";
import { createSiteUrl, getSiteUrl } from "@/lib/site-url";
import type { TreeItem } from "@/lib/types";
import { notFound } from "next/navigation";

interface SharedFolderPageContentProps {
  slug: string;
  requestedFileId?: string;
}

function findFirstFileId(items: TreeItem[]): string | null {
  for (const item of items) {
    if (item.type === "file") {
      return item.id;
    }

    const nestedFileId = item.children ? findFirstFileId(item.children) : null;
    if (nestedFileId) {
      return nestedFileId;
    }
  }

  return null;
}

export async function SharedFolderPageContent({
  slug,
  requestedFileId,
}: SharedFolderPageContentProps) {
  const sharedFolder = await getPublicFolderTreeBySlug(slug);

  if (!sharedFolder) {
    notFound();
  }

  const fallbackFileId = findFirstFileId(sharedFolder.treeItems);
  const selectedFileId = requestedFileId || fallbackFileId;
  let selectedFile = selectedFileId ? await getPublicFolderFileById(slug, selectedFileId) : null;

  if (!selectedFile && requestedFileId && fallbackFileId && fallbackFileId !== requestedFileId) {
    selectedFile = await getPublicFolderFileById(slug, fallbackFileId);
  }

  const siteUrl = getSiteUrl();
  const folderUrl = createSiteUrl(`/view/folder/${slug}`).toString();
  const subfolderCount = Math.max(sharedFolder.folders.length - 1, 0);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: sharedFolder.folder.name,
    description: `Browse the shared folder "${sharedFolder.folder.name}" on Inkdown.`,
    url: folderUrl,
    datePublished: sharedFolder.folder.created_at,
    dateModified: sharedFolder.folder.updated_at,
    publisher: {
      "@type": "Organization",
      name: "Inkdown",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: createSiteUrl("/icon.svg").toString(),
      },
    },
  };

  return (
    <div className="min-h-svh bg-background">
      <JsonLd id="public-folder-structured-data" data={structuredData} />
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" prefetch={false}>
            <InkdownLogo size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/auth/sign-up"
              prefetch={false}
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground outline-none transition-all hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Start writing
              <ArrowRight aria-hidden="true" className="ml-1.5 size-3.5" />
            </Link>
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
        ownerId={sharedFolder.folder.user_id}
      />
    </div>
  );
}
