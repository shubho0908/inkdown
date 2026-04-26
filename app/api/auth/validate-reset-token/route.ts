import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { valid: false, error: 'Token is required' },
      { status: 400 },
    )
  }

  const supabase = await createClient()

  const { data: tokenData, error } = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('token', token)
    .eq('used_at', null)
    .gte('expires_at', new Date().toISOString())
    .single()

  if (error || !tokenData) {
    return NextResponse.json(
      { valid: false, error: 'Invalid or expired token' },
      { status: 400 },
    )
  }

  return NextResponse.json({ valid: true, email: tokenData.email })
}
