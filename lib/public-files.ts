import 'server-only'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export interface PublicFileRecord {
  user_id: string
  slug: string
  name: string
  content: string
  created_at: string
  updated_at: string
  username: string | null
}

export const getPublicFileBySlug = cache(async (slug: string): Promise<PublicFileRecord | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('files')
    .select('user_id, slug, name, content, created_at, updated_at')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  let username: string | null = null
  const profileQuery = await supabase.rpc('get_profile_username', {
    profile_user_id: data.user_id,
  })

  if (!profileQuery.error) {
    username = profileQuery.data ?? null
  }

  return {
    ...data,
    username,
  }
})

export async function listPublicFilesForSitemap(): Promise<PublicFileRecord[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('files')
    .select('user_id, slug, name, content, created_at, updated_at')
    .eq('is_public', true)
    .not('slug', 'is', null)
    .order('updated_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data.map((file) => ({
    ...file,
    username: null,
  }))
}
