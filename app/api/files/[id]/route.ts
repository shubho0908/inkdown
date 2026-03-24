import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: file, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(file)
}

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
  const { name, content, folder_id, is_public } = body

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (name !== undefined) updateData.name = name
  if (content !== undefined) updateData.content = content
  if (folder_id !== undefined) {
    if (folder_id !== null) {
      const { data: targetFolder, error: folderError } = await supabase
        .from('folders')
        .select('id')
        .eq('id', folder_id)
        .eq('user_id', user.id)
        .single()

      if (folderError || !targetFolder) {
        return NextResponse.json({ error: 'Invalid target folder' }, { status: 400 })
      }
    }

    updateData.folder_id = folder_id
  }
  if (is_public !== undefined) {
    updateData.is_public = is_public
    // Generate or clear slug based on public status
    if (is_public) {
      // Check if slug already exists
      const { data: existing } = await supabase
        .from('files')
        .select('slug')
        .eq('id', id)
        .single()
      
      if (!existing?.slug) {
        updateData.slug = nanoid(10)
      }
    }
  }

  const { data: file, error } = await supabase
    .from('files')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(file)
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
    .from('files')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
