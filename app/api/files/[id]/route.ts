import { requireVerifiedUser } from "@/lib/auth/session";
import { createAuthErrorResponse } from "@/lib/auth/server";
import {
  getFileByIdForUser,
  getFileMetadataByIdForUser,
  updateFile,
  deleteFile,
  slugExists,
} from "@/lib/db/files";
import {
  collectPublicFileShareSlugs,
  collectPublicFolderShareSlugsForFileChange,
  listOwnedFolderShareState,
  revalidatePublicFileShares,
  revalidatePublicFolderShares,
} from "@/lib/public-share-cache";
import { generateUniqueShareSlug } from "@/lib/share-slug";
import { parseJsonBody } from "@/lib/validation/parse";
import { updateFileBodySchema } from "@/lib/validation/requests";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authState = await requireVerifiedUser();
  if (authState.kind !== "authenticated") {
    return createAuthErrorResponse(authState);
  }

  const { id } = await params;

  try {
    const file = await getFileByIdForUser(authState.user.id, id);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json(file);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load file" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authState = await requireVerifiedUser();
  if (authState.kind !== "authenticated") {
    return createAuthErrorResponse(authState);
  }

  const [{ id }, parsed] = await Promise.all([
    params,
    parseJsonBody(request, updateFileBodySchema),
  ]);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { name, content, folder_id, is_public } = parsed.data;

  try {
    const currentFile = await getFileMetadataByIdForUser(authState.user.id, id);
    if (!currentFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const folderShareState = await listOwnedFolderShareState(authState.user.id);

    if (folder_id !== undefined && folder_id !== null) {
      const targetFolder = folderShareState.find((folder) => folder.id === folder_id);
      if (!targetFolder) {
        return NextResponse.json({ error: "Invalid target folder" }, { status: 400 });
      }
    }

    let slug = currentFile.slug;
    if (is_public !== undefined && is_public && !currentFile.slug) {
      slug = await generateUniqueShareSlug(async (candidate) => slugExists("files", candidate));
    }

    const file = await updateFile(authState.user.id, id, {
      name,
      content,
      folderId: folder_id,
      isPublic: is_public,
      slug: is_public !== undefined ? slug : undefined,
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const affectedFolderShareSlugs = collectPublicFolderShareSlugsForFileChange(
      folderShareState,
      currentFile.folder_id,
      file.folder_id,
    );
    const affectedFileShareSlugs = collectPublicFileShareSlugs(currentFile.slug, file.slug);

    revalidatePublicFolderShares(affectedFolderShareSlugs);
    revalidatePublicFileShares(affectedFileShareSlugs);

    return NextResponse.json(file);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update file" },
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
    const currentFile = await getFileMetadataByIdForUser(authState.user.id, id);
    if (!currentFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const folderShareState = await listOwnedFolderShareState(authState.user.id);
    const affectedFolderShareSlugs = collectPublicFolderShareSlugsForFileChange(
      folderShareState,
      currentFile.folder_id,
      currentFile.folder_id,
    );

    await deleteFile(authState.user.id, id);

    revalidatePublicFolderShares(affectedFolderShareSlugs);
    revalidatePublicFileShares(collectPublicFileShareSlugs(currentFile.slug));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete file" },
      { status: 500 },
    );
  }
}
