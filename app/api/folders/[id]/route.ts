import { requireVerifiedUser } from "@/lib/auth/session";
import { createAuthErrorResponse } from "@/lib/auth/server";
import { updateFolder, deleteFolder } from "@/lib/db/folders";
import { wouldCreateFolderCycle } from "@/lib/folder-tree";
import {
  collectPublicFolderShareSlugsForFolderDelete,
  collectPublicFolderShareSlugsForFolderUpdate,
  listOwnedFolderShareState,
  revalidatePublicFolderShares,
} from "@/lib/public-share-cache";
import { generateUniqueShareSlug } from "@/lib/share-slug";
import { slugExists } from "@/lib/db/files";
import { parseJsonBody } from "@/lib/validation/parse";
import { updateFolderBodySchema } from "@/lib/validation/requests";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authState = await requireVerifiedUser();
  if (authState.kind !== "authenticated") {
    return createAuthErrorResponse(authState);
  }

  const [{ id }, parsed] = await Promise.all([
    params,
    parseJsonBody(request, updateFolderBodySchema),
  ]);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { name, parent_id, is_public } = parsed.data;

  try {
    const folderShareState = await listOwnedFolderShareState(authState.user.id);
    const currentFolder = folderShareState.find((folder) => folder.id === id);

    if (!currentFolder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    if (parent_id !== undefined && parent_id !== null) {
      const targetFolder = folderShareState.find((folder) => folder.id === parent_id);
      if (!targetFolder) {
        return NextResponse.json({ error: "Invalid target folder" }, { status: 400 });
      }
    }

    if (
      parent_id !== undefined &&
      wouldCreateFolderCycle(folderShareState, currentFolder.id, parent_id)
    ) {
      return NextResponse.json(
        { error: "A folder cannot be moved into itself or one of its subfolders" },
        { status: 400 },
      );
    }

    let slug = currentFolder.slug;
    if (is_public && !currentFolder.slug) {
      slug = await generateUniqueShareSlug(async (candidate) => slugExists("folders", candidate));
    }

    const folder = await updateFolder(authState.user.id, id, {
      name,
      parentId: parent_id,
      isPublic: is_public,
      slug: is_public !== undefined ? slug : undefined,
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const nextFolderShareState = folderShareState.map((entry) =>
      entry.id === folder.id
        ? {
            ...entry,
            parent_id: folder.parent_id,
            slug: folder.slug,
            is_public: folder.is_public,
          }
        : entry,
    );

    const affectedShareSlugs = collectPublicFolderShareSlugsForFolderUpdate(
      folderShareState,
      nextFolderShareState,
      id,
    );

    revalidatePublicFolderShares(affectedShareSlugs);
    return NextResponse.json(folder);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update folder" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authState = await requireVerifiedUser();
  if (authState.kind !== "authenticated") {
    return createAuthErrorResponse(authState);
  }

  const { id } = await params;

  try {
    const folderShareState = await listOwnedFolderShareState(authState.user.id);
    const currentFolder = folderShareState.find((folder) => folder.id === id);

    if (!currentFolder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const affectedShareSlugs = collectPublicFolderShareSlugsForFolderDelete(folderShareState, id);

    const deleted = await deleteFolder(authState.user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    revalidatePublicFolderShares(affectedShareSlugs);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete folder" },
      { status: 500 },
    );
  }
}
