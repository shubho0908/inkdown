import { requireVerifiedUser } from "@/lib/auth";
import { createAuthErrorResponse } from "@/lib/auth/server";
import { wouldCreateFolderCycle } from "@/lib/folder-tree";
import {
  collectPublicFolderShareSlugsForFolderDelete,
  collectPublicFolderShareSlugsForFolderUpdate,
  listOwnedFolderShareState,
  revalidatePublicFolderShares,
} from "@/lib/public-share-cache";
import { generateUniqueShareSlug } from "@/lib/share-slug";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const authState = await requireVerifiedUser(supabase);
  if (authState.kind !== "authenticated") {
    return createAuthErrorResponse(authState);
  }

  const body = await request.json();
  const { name, parent_id, is_public } = body;

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updateData.name = name;
  let folderShareState = [] as Awaited<ReturnType<typeof listOwnedFolderShareState>>;

  try {
    folderShareState = await listOwnedFolderShareState(supabase, authState.user.id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load folders" },
      { status: 500 },
    );
  }

  const currentFolder = folderShareState.find((folder) => folder.id === id);
  if (!currentFolder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  if (parent_id !== undefined) {
    if (parent_id !== null) {
      const targetFolder = folderShareState.find((folder) => folder.id === parent_id);
      if (!targetFolder) {
        return NextResponse.json({ error: "Invalid target folder" }, { status: 400 });
      }
    }

    if (wouldCreateFolderCycle(folderShareState, currentFolder.id, parent_id)) {
      return NextResponse.json(
        { error: "A folder cannot be moved into itself or one of its subfolders" },
        { status: 400 },
      );
    }

    updateData.parent_id = parent_id;
  }

  if (is_public !== undefined) {
    updateData.is_public = is_public;

    if (is_public && !currentFolder.slug) {
      updateData.slug = await generateUniqueShareSlug(async (slug) => {
        const { data, error } = await supabase
          .from("folders")
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

  const { data: folder, error } = await supabase
    .from("folders")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", authState.user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const authState = await requireVerifiedUser(supabase);
  if (authState.kind !== "authenticated") {
    return createAuthErrorResponse(authState);
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

  const currentFolder = folderShareState.find((folder) => folder.id === id);
  if (!currentFolder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  const affectedShareSlugs = collectPublicFolderShareSlugsForFolderDelete(folderShareState, id);

  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", id)
    .eq("user_id", authState.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePublicFolderShares(affectedShareSlugs);

  return NextResponse.json({ success: true });
}
