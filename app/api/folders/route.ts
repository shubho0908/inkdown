import { requireVerifiedUser } from "@/lib/auth/session";
import { createAuthErrorResponse } from "@/lib/auth/server";
import { listFoldersByUserId, insertFolder } from "@/lib/db/folders";
import { formatFolderName } from "@/lib/folder-utils";
import {
  collectPublicFolderShareSlugsForFolderCreate,
  listOwnedFolderShareState,
  revalidatePublicFolderShares,
} from "@/lib/public-share-cache";
import { parseJsonBody } from "@/lib/validation/parse";
import { createFolderBodySchema } from "@/lib/validation/requests";
import { NextResponse } from "next/server";

export async function GET() {
  const authState = await requireVerifiedUser();
  if (authState.kind !== "authenticated") {
    return createAuthErrorResponse(authState);
  }

  try {
    const folders = await listFoldersByUserId(authState.user.id);
    return NextResponse.json(folders);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load folders" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authState = await requireVerifiedUser();
  if (authState.kind !== "authenticated") {
    return createAuthErrorResponse(authState);
  }

  const parsed = await parseJsonBody(request, createFolderBodySchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { name, parent_id } = parsed.data;

  try {
    const folderShareState = await listOwnedFolderShareState(authState.user.id);

    if (parent_id) {
      const parentFolder = folderShareState.find((folder) => folder.id === parent_id);
      if (!parentFolder) {
        return NextResponse.json({ error: "Invalid target folder" }, { status: 400 });
      }
    }

    const affectedShareSlugs = collectPublicFolderShareSlugsForFolderCreate(
      folderShareState,
      parent_id ?? null,
    );

    const folder = await insertFolder({
      userId: authState.user.id,
      name: formatFolderName(name ?? "New Folder"),
      parentId: parent_id ?? null,
    });

    revalidatePublicFolderShares(affectedShareSlugs);
    return NextResponse.json(folder);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create folder" },
      { status: 500 },
    );
  }
}
