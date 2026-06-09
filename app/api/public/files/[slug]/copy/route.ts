import { requireVerifiedUser } from "@/lib/auth/session";
import { createAuthErrorResponse } from "@/lib/auth/server";
import { getPublicFileBySlug, createFile } from "@/lib/db/files";
import {
  collectPublicFolderShareSlugsForFileChange,
  listOwnedFolderShareState,
  revalidatePublicFolderShares,
} from "@/lib/public-share-cache";
import { parseJsonBody } from "@/lib/validation/parse";
import { copySharedItemBodySchema } from "@/lib/validation/requests";
import { NextResponse } from "next/server";

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

    const sharedFile = await getPublicFileBySlug(slug);
    if (!sharedFile) {
      return NextResponse.json({ error: "Shared document not found" }, { status: 404 });
    }

    const affectedShareSlugs = collectPublicFolderShareSlugsForFileChange(
      folderShareState,
      destination_parent_id,
      destination_parent_id,
    );

    const file = await createFile({
      userId: authState.user.id,
      name: sharedFile.name,
      folderId: destination_parent_id,
      content: sharedFile.content,
    });

    revalidatePublicFolderShares(affectedShareSlugs);

    return NextResponse.json({
      success: true,
      fileId: file.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to copy document" },
      { status: 500 },
    );
  }
}
