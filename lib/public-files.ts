import 'server-only'

import { cache } from 'react'

export interface PublicFileRecord {
  user_id: string
  slug: string
  name: string
  content: string
  created_at: string
  updated_at: string
  username: string | null
}

const PUBLIC_FILE_SELECT = 'user_id,slug,name,content,created_at,updated_at'

function getSupabaseRestUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')
  }

  return new URL(path, `${baseUrl}/`)
}

function getSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for public share lookups')
  }

  return key
}

function getSupabaseRestHeaders() {
  const key = getSupabaseServiceRoleKey()

  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

async function fetchPublicFiles(
  searchParams: Record<string, string>,
): Promise<
  Array<Omit<PublicFileRecord, 'username'>>
> {
  const url = getSupabaseRestUrl('/rest/v1/files')
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url, {
    headers: getSupabaseRestHeaders(),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Public file lookup failed with status ${response.status}`)
  }

  const data = (await response.json()) as Array<Omit<PublicFileRecord, 'username'>>
  return Array.isArray(data) ? data : []
}

async function fetchProfileUsername(userId: string) {
  const response = await fetch(getSupabaseRestUrl('/rest/v1/rpc/get_profile_username'), {
    method: 'POST',
    headers: getSupabaseRestHeaders(),
    body: JSON.stringify({ profile_user_id: userId }),
    cache: 'no-store',
  })

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as string | null
  return typeof data === 'string' ? data : null
}

export const getPublicFileBySlug = cache(async (slug: string): Promise<PublicFileRecord | null> => {
  const [data] = await fetchPublicFiles({
    select: PUBLIC_FILE_SELECT,
    slug: `eq.${slug}`,
    is_public: 'eq.true',
    limit: '1',
  })

  if (!data) {
    return null
  }

  return {
    ...data,
    username: await fetchProfileUsername(data.user_id),
  }
})

export async function listPublicFilesForSitemap(): Promise<PublicFileRecord[]> {
  const files = await fetchPublicFiles({
    select: PUBLIC_FILE_SELECT,
    is_public: 'eq.true',
    slug: 'not.is.null',
    order: 'updated_at.desc',
  })

  return files.map((file) => ({
    ...file,
    username: null,
  }))
}
