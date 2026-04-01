import { requireVerifiedUser } from '@/lib/auth'
import { createAuthErrorResponse } from '@/lib/auth/server'
import {
  collectPublicFolderShareSlugsForFileChange,
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

  const { data: files, error } = await supabase
    .from('files')
    .select('*')
    .eq('user_id', authState.user.id)
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(files)
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const authState = await requireVerifiedUser(supabase)
  if (authState.kind !== 'authenticated') {
    return createAuthErrorResponse(authState)
  }

  const body = await request.json()
  const { name, folder_id, content } = body
  let folderShareState = [] as Awaited<ReturnType<typeof listOwnedFolderShareState>>

  try {
    folderShareState = await listOwnedFolderShareState(supabase, authState.user.id)

    if (folder_id && !folderShareState.find((folder) => folder.id === folder_id)) {
      return NextResponse.json({ error: 'Invalid target folder' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not validate target folder' },
      { status: 500 },
    )
  }

  const affectedShareSlugs = collectPublicFolderShareSlugsForFileChange(
    folderShareState,
    folder_id || null,
    folder_id || null,
  )

  const { data: file, error } = await supabase
    .from('files')
    .insert({
      name: name || 'Untitled.md',
      folder_id: folder_id || null,
      content: content || '# New Document\n\nStart writing here...',
      user_id: authState.user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidatePublicFolderShares(affectedShareSlugs)

  return NextResponse.json(file)
}
