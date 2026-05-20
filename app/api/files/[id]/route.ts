import { requireVerifiedUser } from "@/lib/auth";
import { createAuthErrorResponse } from "@/lib/auth/server";
import {
  collectPublicFileShareSlugs,
  collectPublicFolderShareSlugsForFileChange,
  listOwnedFolderShareState,
  revalidatePublicFileShares,
  revalidatePublicFolderShares,
} from "@/lib/public-share-cache";
import { generateUniqueShareSlug } from "@/lib/share-slug";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const authState = await requireVerifiedUser(supabase);
  if (authState.kind !== "authenticated") {
    return createAuthErrorResponse(authState);
  }

  const { data: file, error } = await supabase
    .from("files")
    .select("*")
    .eq("id", id)
    .eq("user_id", authState.user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(file);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const authState = await requireVerifiedUser(supabase);
  if (authState.kind !== "authenticated") {
    return createAuthErrorResponse(authState);
  }

  const body = await request.json();
  const { name, content, folder_id, is_public } = body;

  const { data: currentFile, error: currentFileError } = await supabase
    .from("files")
    .select("id, folder_id, slug, is_public")
    .eq("id", id)
    .eq("user_id", authState.user.id)
    .maybeSingle();

  if (currentFileError) {
    return NextResponse.json({ error: currentFileError.message }, { status: 500 });
  }

  if (!currentFile) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  let folderShareState = [] as Awaited<ReturnType<typeof listOwnedFolderShareState>>;

  try {
    folderShareState = await listOwnedFolderShareState(supabase, authState.user.id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load folders" },
      { status: 500 },
    );
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updateData.name = name;
  if (content !== undefined) updateData.content = content;
  if (folder_id !== undefined) {
    if (folder_id !== null) {
      const targetFolder = folderShareState.find((folder) => folder.id === folder_id);

      if (!targetFolder) {
        return NextResponse.json({ error: "Invalid target folder" }, { status: 400 });
      }
    }

    updateData.folder_id = folder_id;
  }
  if (is_public !== undefined) {
    updateData.is_public = is_public;
    if (is_public) {
      if (!currentFile.slug) {
        updateData.slug = await generateUniqueShareSlug(async (slug) => {
          const { data, error } = await supabase
            .from("files")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();

          if (error) {
            throw error;
          }

          return Boolean(data);
        });
      }
    }
  }

  const { data: file, error } = await supabase
    .from("files")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", authState.user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const authState = await requireVerifiedUser(supabase);
  if (authState.kind !== "authenticated") {
    return createAuthErrorResponse(authState);
  }

  const { data: currentFile, error: currentFileError } = await supabase
    .from("files")
    .select("folder_id, slug")
    .eq("id", id)
    .eq("user_id", authState.user.id)
    .maybeSingle();

  if (currentFileError) {
    return NextResponse.json({ error: currentFileError.message }, { status: 500 });
  }

  if (!currentFile) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  let folderShareState = [] as Awaited<ReturnType<typeof listOwnedFolderShareState>>;

  try {
    folderShareState = await listOwnedFolderShareState(supabase, authState.user.id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load folders" },
      { status: 500 },
    );
  }

  const affectedFolderShareSlugs = collectPublicFolderShareSlugsForFileChange(
    folderShareState,
    currentFile.folder_id,
    currentFile.folder_id,
  );

  const { error } = await supabase
    .from("files")
    .delete()
    .eq("id", id)
    .eq("user_id", authState.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePublicFolderShares(affectedFolderShareSlugs);

  revalidatePublicFileShares(collectPublicFileShareSlugs(currentFile.slug));

  return NextResponse.json({ success: true });
}
