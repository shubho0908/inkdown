import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, parent_id } = body

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (name !== undefined) updateData.name = name
  if (parent_id !== undefined) {
    if (parent_id === id) {
      return NextResponse.json({ error: 'A folder cannot be moved into itself' }, { status: 400 })
    }

    if (parent_id !== null) {
      const { data: folders, error: foldersError } = await supabase
        .from('folders')
        .select('id, parent_id')
        .eq('user_id', user.id)

      if (foldersError) {
        return NextResponse.json({ error: foldersError.message }, { status: 500 })
      }

      const targetFolder = folders.find((folder) => folder.id === parent_id)
      if (!targetFolder) {
        return NextResponse.json({ error: 'Invalid target folder' }, { status: 400 })
      }

      const descendantIds = new Set<string>([id])
      let found = true

      while (found) {
        found = false
        for (const folder of folders) {
          if (
            folder.parent_id &&
            descendantIds.has(folder.parent_id) &&
            !descendantIds.has(folder.id)
          ) {
            descendantIds.add(folder.id)
            found = true
          }
        }
      }

      if (descendantIds.has(parent_id)) {
        return NextResponse.json(
          { error: 'A folder cannot be moved into one of its subfolders' },
          { status: 400 },
        )
      }
    }

    updateData.parent_id = parent_id
  }

  const { data: folder, error } = await supabase
    .from('folders')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
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
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
