import { requireVerifiedUser } from '@/lib/auth'
import { createAuthErrorResponse } from '@/lib/auth/server'
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

  const { data: folder, error } = await supabase
    .from('folders')
    .insert({
      name: name || 'New Folder',
      parent_id: parent_id || null,
      user_id: authState.user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(folder)
}
