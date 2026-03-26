import { requireVerifiedUser } from '@/lib/auth'
import { createAuthErrorResponse } from '@/lib/auth/server'
import { generateUniqueShareSlug } from '@/lib/share-slug'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const authState = await requireVerifiedUser(supabase)
  if (authState.kind !== 'authenticated') {
    return createAuthErrorResponse(authState)
  }

  const { data: file, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', id)
    .eq('user_id', authState.user.id)
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

  const authState = await requireVerifiedUser(supabase)
  if (authState.kind !== 'authenticated') {
    return createAuthErrorResponse(authState)
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
        .eq('user_id', authState.user.id)
        .single()

      if (folderError || !targetFolder) {
        return NextResponse.json({ error: 'Invalid target folder' }, { status: 400 })
      }
    }

    updateData.folder_id = folder_id
  }
  if (is_public !== undefined) {
    updateData.is_public = is_public
    if (is_public) {
      const { data: existing } = await supabase
        .from('files')
        .select('slug')
        .eq('id', id)
        .single()

      if (!existing?.slug) {
        updateData.slug = await generateUniqueShareSlug(async (slug) => {
          const { data, error } = await supabase
            .from('files')
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
  }

  const { data: file, error } = await supabase
    .from('files')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', authState.user.id)
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

  const authState = await requireVerifiedUser(supabase)
  if (authState.kind !== 'authenticated') {
    return createAuthErrorResponse(authState)
  }

  const { error } = await supabase
    .from('files')
    .delete()
    .eq('id', id)
    .eq('user_id', authState.user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
