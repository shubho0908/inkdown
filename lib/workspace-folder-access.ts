import 'server-only'

import { createClient } from '@/lib/supabase/server'

export async function getOwnedFolderById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  folderId: string | null | undefined,
) {
  if (!folderId) {
    return null
  }

  const { data: folder, error } = await supabase
    .from('folders')
    .select('id')
    .eq('id', folderId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return folder
}
