import { requireVerifiedUser } from "@/lib/auth/session";
import { createAuthErrorResponse } from "@/lib/auth/server";
import { listFileMetadataByUserId, createFile } from "@/lib/db/files";
import {
  collectPublicFolderShareSlugsForFileChange,
  listOwnedFolderShareState,
  revalidatePublicFolderShares,
} from "@/lib/public-share-cache";
import { parseJsonBody } from "@/lib/validation/parse";
import { createFileBodySchema } from "@/lib/validation/requests";
import { NextResponse } from "next/server";

export async function GET() {
  const authState = await requireVerifiedUser();
  if (authState.kind !== "authenticated") {
    return createAuthErrorResponse(authState);
  }

  try {
    const files = await listFileMetadataByUserId(authState.user.id);
    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load files" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authState = await requireVerifiedUser();
  if (authState.kind !== "authenticated") {
    return createAuthErrorResponse(authState);
  }

  const parsed = await parseJsonBody(request, createFileBodySchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { name, folder_id, content } = parsed.data;

  try {
    const folderShareState = await listOwnedFolderShareState(authState.user.id);

    if (folder_id && !folderShareState.find((folder) => folder.id === folder_id)) {
      return NextResponse.json({ error: "Invalid target folder" }, { status: 400 });
    }

    const affectedShareSlugs = collectPublicFolderShareSlugsForFileChange(
      folderShareState,
      folder_id ?? null,
      folder_id ?? null,
    );

    const file = await createFile({
      userId: authState.user.id,
      name: name ?? "Untitled.md",
      folderId: folder_id ?? null,
      content,
    });

    revalidatePublicFolderShares(affectedShareSlugs);
    return NextResponse.json(file);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not create file",
      },
      { status: 500 },
    );
  }
}
