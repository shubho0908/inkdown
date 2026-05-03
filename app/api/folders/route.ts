import { requireVerifiedUser } from '@/lib/auth'
import { createAuthErrorResponse } from '@/lib/auth/server'
import { formatFolderName } from '@/lib/folder-utils'
import {
  collectPublicFolderShareSlugsForFolderCreate,
  listOwnedFolderShareState,
  revalidatePublicFolderShares,
} from '@/lib/public-share-cache'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const authState = await requireVerifiedUser(supabase)
  if (authState.kind !== 'authenticated') {
    return createAuthErrorResponse(authState)
  }

  const { data: folders, error } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', authState.user.id)
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(folders)
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const authState = await requireVerifiedUser(supabase)
  if (authState.kind !== 'authenticated') {
    return createAuthErrorResponse(authState)
  }

  const body = await request.json()
  const { name, parent_id } = body
  let folderShareState = [] as Awaited<ReturnType<typeof listOwnedFolderShareState>>

  try {
    folderShareState = await listOwnedFolderShareState(supabase, authState.user.id)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load folders' },
      { status: 500 },
    )
  }

  if (parent_id) {
    const parentFolder = folderShareState.find((folder) => folder.id === parent_id)

    if (!parentFolder) {
      return NextResponse.json({ error: 'Invalid target folder' }, { status: 400 })
    }
  }

  const affectedShareSlugs = collectPublicFolderShareSlugsForFolderCreate(
    folderShareState,
    parent_id || null,
  )

  const { data: folder, error } = await supabase
    .from('folders')
    .insert({
      name: formatFolderName(name || 'New Folder'),
      parent_id: parent_id || null,
      user_id: authState.user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidatePublicFolderShares(affectedShareSlugs)

  return NextResponse.json(folder)
}
