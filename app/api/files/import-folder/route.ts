import { requireVerifiedUser } from "@/lib/auth/session";
import { createAuthErrorResponse } from "@/lib/auth/server";
import { formatFolderName } from "@/lib/folder-utils";
import { normalizeMarkdownImportFileName } from "@/lib/markdown-import-constants";
import {
  collectPublicFolderShareSlugsForFileChange,
  listOwnedFolderShareState,
  revalidatePublicFolderShares,
} from "@/lib/public-share-cache";
import { insertFolder } from "@/lib/db/folders";
import { bulkInsertFiles } from "@/lib/db/files";
import { parseJsonBody } from "@/lib/validation/parse";
import { importFolderBodySchema } from "@/lib/validation/requests";
import { NextResponse } from "next/server";

const BATCH_SIZE = 150;

export async function POST(request: Request) {
  const authState = await requireVerifiedUser();
  if (authState.kind !== "authenticated") {
    return createAuthErrorResponse(authState);
  }

  const parsed = await parseJsonBody(request, importFolderBodySchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { folder_id: folderId, folders, files } = parsed.data;

  try {
    const folderShareState = await listOwnedFolderShareState(authState.user.id);

    if (folderId && !folderShareState.find((folder) => folder.id === folderId)) {
      return NextResponse.json({ error: "Invalid target folder" }, { status: 400 });
    }

    const affectedShareSlugs = collectPublicFolderShareSlugsForFileChange(
      folderShareState,
      folderId ?? null,
      folderId ?? null,
    );

    const foldersWithDepth = folders.map((folder) => ({
      ...folder,
      depth: folder.relativePath.split("/").length,
    }));

    const sortedFolders = foldersWithDepth.sort((a, b) => a.depth - b.depth);
    const foldersByDepth = new Map<number, typeof sortedFolders>();
    for (const folder of sortedFolders) {
      const siblings = foldersByDepth.get(folder.depth) ?? [];
      siblings.push(folder);
      foldersByDepth.set(folder.depth, siblings);
    }

    const userId = authState.user.id;
    const folderPathToId = new Map<string, string>();
    const createdFolders: Array<{ id: string; name: string; parent_id: string | null }> = [];
    const depths = [...foldersByDepth.keys()].toSorted((a, b) => a - b);

    async function createFoldersAtDepth(depthIndex: number): Promise<void> {
      if (depthIndex >= depths.length) return;

      const depth = depths[depthIndex];
      const batch = foldersByDepth.get(depth) ?? [];
      const inserted = await Promise.all(
        batch.map(async (folder) => {
          const pathParts = folder.relativePath.split("/");
          const folderName = pathParts.pop()!;
          const parentPath = pathParts.join("/");

          let parentId = folderId ?? null;
          if (parentPath && folderPathToId.has(parentPath)) {
            parentId = folderPathToId.get(parentPath)!;
          }

          const createdFolder = await insertFolder({
            userId,
            name: formatFolderName(folderName),
            parentId,
          });

          return { relativePath: folder.relativePath, createdFolder };
        }),
      );

      for (const { relativePath, createdFolder } of inserted) {
        folderPathToId.set(relativePath, createdFolder.id);
        createdFolders.push(createdFolder);
      }

      await createFoldersAtDepth(depthIndex + 1);
    }

    await createFoldersAtDepth(0);

    const fileBatches = Array.from({ length: Math.ceil(files.length / BATCH_SIZE) }, (_, index) =>
      files.slice(index * BATCH_SIZE, (index + 1) * BATCH_SIZE),
    );

    const batchResults = await Promise.all(
      fileBatches.map((batch) => {
        const payload = batch.map((file) => {
          const pathParts = file.relativePath.split("/");
          pathParts.pop();
          const folderPath = pathParts.join("/");

          let fileFolderId = folderId ?? null;
          if (folderPath && folderPathToId.has(folderPath)) {
            fileFolderId = folderPathToId.get(folderPath)!;
          }

          return {
            name: normalizeMarkdownImportFileName(file.name),
            content: file.content,
            folderId: fileFolderId,
          };
        });

        return bulkInsertFiles(authState.user.id, payload);
      }),
    );

    const allCreatedFiles = batchResults.flat();

    revalidatePublicFolderShares(affectedShareSlugs);

    return NextResponse.json({
      folders: createdFolders,
      files: allCreatedFiles,
    });
  } catch (error) {
    console.error("Import folder error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import folder" },
      { status: 500 },
    );
  }
}
