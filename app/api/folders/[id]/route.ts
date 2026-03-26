import { requireVerifiedUser } from '@/lib/auth'
import { createAuthErrorResponse } from '@/lib/auth/server'
import { wouldCreateFolderCycle } from '@/lib/folder-tree'
import { generateUniqueShareSlug } from '@/lib/share-slug'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const authState = await requireVerifiedUser(supabase)
  if (authState.kind !== 'authenticated') {
    return createAuthErrorResponse(authState)
  }

  const body = await request.json()
  const { name, parent_id, is_public } = body

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (name !== undefined) updateData.name = name
  let currentFolder:
    | {
        id: string
        parent_id: string | null
        slug: string | null
      }
    | undefined

  if (parent_id !== undefined || is_public !== undefined) {
    const { data: folders, error: foldersError } = await supabase
      .from('folders')
      .select('id, parent_id, slug')
      .eq('user_id', authState.user.id)

    if (foldersError) {
      return NextResponse.json({ error: foldersError.message }, { status: 500 })
    }

    currentFolder = folders.find((folder) => folder.id === id)
    if (!currentFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }
 
    if (parent_id !== undefined) {
      if (parent_id !== null) {
        const targetFolder = folders.find((folder) => folder.id === parent_id)
        if (!targetFolder) {
          return NextResponse.json({ error: 'Invalid target folder' }, { status: 400 })
        }
      }

      if (wouldCreateFolderCycle(folders, currentFolder.id, parent_id)) {
        return NextResponse.json(
          { error: 'A folder cannot be moved into itself or one of its subfolders' },
          { status: 400 },
        )
      }

      updateData.parent_id = parent_id
    }
  }

  if (is_public !== undefined) {
    updateData.is_public = is_public

    if (is_public && !currentFolder?.slug) {
      updateData.slug = await generateUniqueShareSlug(async (slug) => {
        const { data, error } = await supabase
          .from('folders')
          .select('id')
          .eq('slug', slug)
          .maybeSingle()

        if (error) {
          throw error
        }

        return Boolean(data)
      })
    }
  }

  const { data: folder, error } = await supabase
    .from('folders')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', authState.user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(folder)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const authState = await requireVerifiedUser(supabase)
  if (authState.kind !== 'authenticated') {
    return createAuthErrorResponse(authState)
  }

  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id)
    .eq('user_id', authState.user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
