import 'server-only'

import { cache } from 'react'
import { fetchProfileUsername, fetchRestRows } from '@/lib/public-share-utils'

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

async function fetchPublicFiles(
  searchParams: Record<string, string>,
): Promise<
  Array<Omit<PublicFileRecord, 'username'>>
> {
  return fetchRestRows<Omit<PublicFileRecord, 'username'>>('/rest/v1/files', searchParams)
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
