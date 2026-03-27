import { requireVerifiedUser } from '@/lib/auth'
import { createAuthErrorResponse } from '@/lib/auth/server'
import {
  normalizeMarkdownImportFileName,
  validateMarkdownImportPayload,
  type MarkdownImportPayloadFile,
} from '@/lib/markdown-import'
import { createClient } from '@/lib/supabase/server'
import { getOwnedFolderById } from '@/lib/workspace-folder-access'
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

  try {
    const folder = await getOwnedFolderById(supabase, authState.user.id, folderId)

    if (folderId && !folder) {
      return NextResponse.json({ error: 'Invalid target folder' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not validate target folder' },
      { status: 500 },
    )
  }

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

  return NextResponse.json(createdFiles)
}
