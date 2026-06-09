import { requireVerifiedUser } from "@/lib/auth/session";
import { createAuthErrorResponse } from "@/lib/auth/server";
import { bulkInsertFiles } from "@/lib/db/files";
import { normalizeMarkdownImportFileName } from "@/lib/markdown-import-constants";
import {
  collectPublicFolderShareSlugsForFileChange,
  listOwnedFolderShareState,
  revalidatePublicFolderShares,
} from "@/lib/public-share-cache";
import { parseJsonBody } from "@/lib/validation/parse";
import { importFilesBodySchema } from "@/lib/validation/requests";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const authState = await requireVerifiedUser();
  if (authState.kind !== "authenticated") {
    return createAuthErrorResponse(authState);
  }

  const parsed = await parseJsonBody(request, importFilesBodySchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { folder_id: folderId, files } = parsed.data;

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

    const createdFiles = await bulkInsertFiles(
      authState.user.id,
      files.map((file) => ({
        name: normalizeMarkdownImportFileName(file.name),
        content: file.content,
        folderId: folderId ?? null,
      })),
    );

    revalidatePublicFolderShares(affectedShareSlugs);
    return NextResponse.json(createdFiles);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import files" },
      { status: 500 },
    );
  }
}
