import { requireVerifiedUser } from "@/lib/auth/session";
import { createAuthErrorResponse } from "@/lib/auth/server";
import { createFile } from "@/lib/db/files";
import { insertFolder } from "@/lib/db/folders";
import { getPublicFolderSnapshot } from "@/lib/db/public-snapshot";
import {
  collectPublicFolderShareSlugsForFolderCreate,
  listOwnedFolderShareState,
  revalidatePublicFolderShares,
} from "@/lib/public-share-cache";
import { parseJsonBody } from "@/lib/validation/parse";
import { copySharedItemBodySchema } from "@/lib/validation/requests";
import type { Folder } from "@/lib/validation/models";
import { NextResponse } from "next/server";

function groupFoldersByDepthFromRoot(foldersToGroup: Folder[], rootFolderId: string): Folder[][] {
  const folderById = new Map(foldersToGroup.map((folder) => [folder.id, folder]));
  const depthById = new Map<string, number>();

  const getDepth = (folderId: string): number => {
    const cached = depthById.get(folderId);
    if (cached !== undefined) return cached;

    const folder = folderById.get(folderId);
    if (!folder || folder.id === rootFolderId) {
      depthById.set(folderId, 0);
      return 0;
    }

    const depth = getDepth(folder.parent_id ?? "") + 1;
    depthById.set(folderId, depth);
    return depth;
  };

  for (const folder of foldersToGroup) {
    getDepth(folder.id);
  }

  const maxDepth = Math.max(...depthById.values());
  const batches: Folder[][] = [];

  for (let depth = 0; depth <= maxDepth; depth += 1) {
    batches.push(foldersToGroup.filter((folder) => depthById.get(folder.id) === depth));
  }

  return batches;
}

function sortFoldersForCopy(foldersToSort: Folder[], rootFolderId: string) {
  const foldersByParentId = new Map<string | null, Folder[]>();

  for (const folder of foldersToSort) {
    const siblings = foldersByParentId.get(folder.parent_id) ?? [];
    siblings.push(folder);
    foldersByParentId.set(folder.parent_id, siblings);
  }

  const rootFolder = foldersToSort.find((folder) => folder.id === rootFolderId);
  if (!rootFolder) return [];

  const sortedFolders: Folder[] = [];
  const queue = [rootFolder];

  while (queue.length > 0) {
    const folder = queue.shift()!;
    sortedFolders.push(folder);
    queue.push(...(foldersByParentId.get(folder.id) ?? []));
  }

  return sortedFolders;
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const authState = await requireVerifiedUser();
  if (authState.kind !== "authenticated") {
    return createAuthErrorResponse(authState);
  }

  const [{ slug }, parsed] = await Promise.all([
    params,
    parseJsonBody(request, copySharedItemBodySchema),
  ]);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { destination_parent_id } = parsed.data;

  try {
    const folderShareState = await listOwnedFolderShareState(authState.user.id);

    if (destination_parent_id) {
      const parentFolder = folderShareState.find((folder) => folder.id === destination_parent_id);
      if (!parentFolder) {
        return NextResponse.json({ error: "Invalid destination folder" }, { status: 400 });
      }
    }

    const affectedShareSlugs = collectPublicFolderShareSlugsForFolderCreate(
      folderShareState,
      destination_parent_id || null,
    );

    const snapshot = await getPublicFolderSnapshot(slug);
    if (!snapshot) {
      return NextResponse.json({ error: "Shared folder not found" }, { status: 404 });
    }

    const foldersToCopy = sortFoldersForCopy(snapshot.folders, snapshot.rootFolder.id);

    if (foldersToCopy.length !== snapshot.folders.length) {
      throw new Error("Shared folder tree is incomplete");
    }

    const userId = authState.user.id;
    const rootFolderId = snapshot.rootFolder.id;
    const folderMap = new Map<string, string>();
    const folderBatches = groupFoldersByDepthFromRoot(foldersToCopy, rootFolderId);

    async function copyFolderBatch(batchIndex: number): Promise<void> {
      if (batchIndex >= folderBatches.length) return;

      const batch = folderBatches[batchIndex];
      const inserted = await Promise.all(
        batch.map(async (folder) => {
          const parentId =
            folder.id === rootFolderId
              ? destination_parent_id
              : folderMap.get(folder.parent_id ?? "");

          if (folder.id !== rootFolderId && !parentId) {
            throw new Error(`Missing copied parent for folder "${folder.name}"`);
          }

          const newFolder = await insertFolder({
            userId,
            name: folder.name,
            parentId: parentId || null,
          });

          return { sourceId: folder.id, newId: newFolder.id };
        }),
      );

      for (const { sourceId, newId } of inserted) {
        folderMap.set(sourceId, newId);
      }

      await copyFolderBatch(batchIndex + 1);
    }

    await copyFolderBatch(0);

    await Promise.all(
      snapshot.files.map(async (file) => {
        if (!file.folder_id) {
          throw new Error(`Shared file "${file.name}" is missing a folder reference`);
        }

        const newFolderId = folderMap.get(file.folder_id);
        if (!newFolderId) {
          throw new Error(`Missing copied folder for file "${file.name}"`);
        }

        await createFile({
          userId: authState.user.id,
          name: file.name,
          folderId: newFolderId,
          content: file.content ?? "",
        });
      }),
    );

    revalidatePublicFolderShares(affectedShareSlugs);

    return NextResponse.json({
      success: true,
      folderId: folderMap.get(snapshot.rootFolder.id),
      folderCount: folderMap.size,
      fileCount: snapshot.files.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to copy folder";
    const status = message === "Shared folder not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
