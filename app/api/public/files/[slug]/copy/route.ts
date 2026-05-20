import { requireVerifiedUser } from "@/lib/auth";
import { createAuthErrorResponse } from "@/lib/auth/server";
import {
  collectPublicFolderShareSlugsForFileChange,
  listOwnedFolderShareState,
  revalidatePublicFolderShares,
} from "@/lib/public-share-cache";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface CopyFileRequest {
  destination_parent_id: string | null;
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient();
  const { slug } = await params;

  const authState = await requireVerifiedUser(supabase);
  if (authState.kind !== "authenticated") {
    return createAuthErrorResponse(authState);
  }

  const body: CopyFileRequest = await request.json();
  const { destination_parent_id } = body;

  let folderShareState = [] as Awaited<ReturnType<typeof listOwnedFolderShareState>>;
  try {
    folderShareState = await listOwnedFolderShareState(supabase, authState.user.id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load folders" },
      { status: 500 },
    );
  }

  if (destination_parent_id) {
    const parentFolder = folderShareState.find((folder) => folder.id === destination_parent_id);
    if (!parentFolder) {
      return NextResponse.json({ error: "Invalid destination folder" }, { status: 400 });
    }
  }

  const { data: sharedFile, error: fetchError } = await supabase
    .from("files")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (fetchError || !sharedFile) {
    return NextResponse.json({ error: "Shared document not found" }, { status: 404 });
  }

  const affectedShareSlugs = collectPublicFolderShareSlugsForFileChange(
    folderShareState,
    destination_parent_id || null,
    destination_parent_id || null,
  );

  const { data: file, error } = await supabase
    .from("files")
    .insert({
      name: sharedFile.name,
      folder_id: destination_parent_id || null,
      content: sharedFile.content,
      user_id: authState.user.id,
      is_public: false,
      slug: null,
    })
    .select()
    .single();

  if (error || !file) {
    return NextResponse.json(
      { error: error?.message || "Failed to copy document" },
      { status: 500 },
    );
  }

  revalidatePublicFolderShares(affectedShareSlugs);

  return NextResponse.json({
    success: true,
    fileId: file.id,
  });
}
