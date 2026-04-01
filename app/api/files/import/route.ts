import { requireVerifiedUser } from '@/lib/auth'
import { createAuthErrorResponse } from '@/lib/auth/server'
import {
  normalizeMarkdownImportFileName,
  validateMarkdownImportPayload,
  type MarkdownImportPayloadFile,
} from '@/lib/markdown-import'
import {
  collectPublicFolderShareSlugsForFileChange,
  listOwnedFolderShareState,
  revalidatePublicFolderShares,
} from '@/lib/public-share-cache'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface ImportFilesRequestBody {
  folder_id?: string | null
  files?: MarkdownImportPayloadFile[]
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const authState = await requireVerifiedUser(supabase)
  if (authState.kind !== 'authenticated') {
    return createAuthErrorResponse(authState)
  }

  let body: ImportFilesRequestBody

  try {
    body = (await request.json()) as ImportFilesRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid import payload' }, { status: 400 })
  }

  const folderId = body.folder_id ?? null
  const files = Array.isArray(body.files) ? body.files : []

  const validationError = validateMarkdownImportPayload(files)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  let folderShareState = [] as Awaited<ReturnType<typeof listOwnedFolderShareState>>

  try {
    folderShareState = await listOwnedFolderShareState(supabase, authState.user.id)

    if (folderId && !folderShareState.find((folder) => folder.id === folderId)) {
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
    folderId,
    folderId,
  )

  const { data: createdFiles, error } = await supabase
    .from('files')
    .insert(
      files.map((file) => ({
        name: normalizeMarkdownImportFileName(file.name),
        content: file.content,
        folder_id: folderId,
        user_id: authState.user.id,
      })),
    )
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidatePublicFolderShares(affectedShareSlugs)

  return NextResponse.json(createdFiles)
}
