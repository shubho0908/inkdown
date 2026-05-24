import "server-only";

import { cache } from "react";
import { getPublicFolderShareTag } from "@/lib/public-share-cache";
import { buildTree } from "@/lib/workspace-tree";
import type { TreeItem } from "@/lib/types";
import { fetchProfileUsername, fetchRestRows, postRestRpc } from "@/lib/public-share-utils";

interface PublicFolderRow {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  slug: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface PublicFolderFileRow {
  id: string;
  user_id: string;
  folder_id: string;
  name: string;
  slug: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface PublicFolderFileContentRow extends PublicFolderFileRow {
  content: string;
}

export interface PublicFolderRecord extends PublicFolderRow {
  username: string | null;
}

export interface PublicFolderTreeData {
  folder: PublicFolderRecord;
  folders: PublicFolderRow[];
  files: PublicFolderFileRow[];
  treeItems: TreeItem[];
}

export interface PublicFolderFileRecord extends PublicFolderFileContentRow {
  username: string | null;
}

const PUBLIC_FOLDER_SELECT = "id,user_id,name,parent_id,slug,is_public,created_at,updated_at";

function normalizeTreeItemsToSharedRoot(items: TreeItem[], rootFolderId: string) {
  const rootFolder = items.find(
    (item): item is TreeItem & { type: "folder" } =>
      item.type === "folder" && item.id === rootFolderId,
  );

  if (!rootFolder) {
    return [];
  }

  return [rootFolder];
}

async function fetchPublicFolders(
  searchParams: Record<string, string>,
  options?: { tags?: string[] },
) {
  return fetchRestRows<PublicFolderRow>("/rest/v1/folders", searchParams, options);
}

async function fetchFolderTreeFolders(slug: string) {
  const rows = await postRestRpc<PublicFolderRow[]>(
    "get_public_folder_subtree_folders",
    { folder_slug: slug },
    { tags: [getPublicFolderShareTag(slug)] },
  );

  return Array.isArray(rows) ? rows : [];
}

async function fetchFolderTreeFiles(slug: string) {
  const rows = await postRestRpc<PublicFolderFileRow[]>(
    "get_public_folder_subtree_files",
    { folder_slug: slug },
    { tags: [getPublicFolderShareTag(slug)] },
  );

  return Array.isArray(rows) ? rows : [];
}

async function fetchFolderFile(slug: string, fileId: string) {
  const rows = await postRestRpc<PublicFolderFileContentRow[]>(
    "get_public_folder_file",
    { folder_slug: slug, target_file_id: fileId },
    { tags: [getPublicFolderShareTag(slug)] },
  );

  return Array.isArray(rows) ? (rows[0] ?? null) : null;
}

export const getPublicFolderBySlug = cache(
  async (slug: string): Promise<PublicFolderRecord | null> => {
    const [folder] = await fetchPublicFolders(
      {
        select: PUBLIC_FOLDER_SELECT,
        slug: `eq.${slug}`,
        is_public: "eq.true",
        limit: "1",
      },
      { tags: [getPublicFolderShareTag(slug)] },
    );

    if (!folder) {
      return null;
    }

    return {
      ...folder,
      username: await fetchProfileUsername(folder.user_id),
    };
  },
);

export const getPublicFolderTreeBySlug = cache(
  async (slug: string): Promise<PublicFolderTreeData | null> => {
    const folder = await getPublicFolderBySlug(slug);

    if (!folder) {
      return null;
    }

    const [folders, files] = await Promise.all([
      fetchFolderTreeFolders(slug),
      fetchFolderTreeFiles(slug),
    ]);

    const treeItems = normalizeTreeItemsToSharedRoot(
      buildTree(
        folders,
        files.map((file) => ({ ...file, content: "" })),
      ),
      folder.id,
    );

    return {
      folder,
      folders,
      files,
      treeItems,
    };
  },
);

export const getPublicFolderFileById = cache(
  async (slug: string, fileId: string): Promise<PublicFolderFileRecord | null> => {
    const [folder, file] = await Promise.all([
      getPublicFolderBySlug(slug),
      fetchFolderFile(slug, fileId),
    ]);

    if (!folder || !file) {
      return null;
    }

    return {
      ...file,
      username: folder.username,
    };
  },
);

export async function listPublicFoldersForSitemap(): Promise<PublicFolderRecord[]> {
  const folders = await fetchPublicFolders({
    select: PUBLIC_FOLDER_SELECT,
    is_public: "eq.true",
    slug: "not.is.null",
    order: "updated_at.desc",
  });

  return folders.map((folder) => ({
    ...folder,
    username: null,
  }));
}

export async function listPublicFolderFileStaticParams(): Promise<
  Array<{ slug: string; fileId: string }>
> {
  const folders = await listPublicFoldersForSitemap();
  const params = await Promise.all(
    folders.map(async (folder) => {
      if (!folder.slug) {
        return [];
      }

      const files = await fetchFolderTreeFiles(folder.slug);
      return files.map((file) => ({
        slug: folder.slug!,
        fileId: file.id,
      }));
    }),
  );

  return params.flat();
}
