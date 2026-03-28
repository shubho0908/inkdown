import 'server-only'

const PUBLIC_SHARE_REVALIDATE_SECONDS = 60

function getSupabaseRestUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')
  }

  return new URL(path, `${baseUrl}/`)
}

function getSupabaseRestKey() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!key) {
    throw new Error(
      'A Supabase REST key is required for public share lookups. Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    )
  }

  return key
}

export function getSupabaseRestHeaders() {
  const key = getSupabaseRestKey()

  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

export async function fetchRestRows<T>(
  path: string,
  searchParams: Record<string, string>,
): Promise<T[]> {
  const url = getSupabaseRestUrl(path)
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url, {
    headers: getSupabaseRestHeaders(),
    next: { revalidate: PUBLIC_SHARE_REVALIDATE_SECONDS },
  })

  if (!response.ok) {
    throw new Error(`Public share lookup failed with status ${response.status}`)
  }

  const data = (await response.json()) as T[]
  return Array.isArray(data) ? data : []
}

export async function postRestRpc<T>(functionName: string, body: Record<string, unknown>) {
  const response = await fetch(getSupabaseRestUrl(`/rest/v1/rpc/${functionName}`), {
    method: 'POST',
    headers: getSupabaseRestHeaders(),
    body: JSON.stringify(body),
    next: { revalidate: PUBLIC_SHARE_REVALIDATE_SECONDS },
  })

  if (!response.ok) {
    throw new Error(
      `Public share RPC "${functionName}" failed with status ${response.status}`,
    )
  }

  return (await response.json()) as T
}

export async function fetchProfileUsername(userId: string) {
  const response = await fetch(getSupabaseRestUrl('/rest/v1/rpc/get_profile_username'), {
    method: 'POST',
    headers: getSupabaseRestHeaders(),
    body: JSON.stringify({ profile_user_id: userId }),
    next: { revalidate: PUBLIC_SHARE_REVALIDATE_SECONDS },
  })

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as string | null
  return typeof data === 'string' ? data : null
}
