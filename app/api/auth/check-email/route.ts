import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    let email: string
    try {
      const body = await request.json()
      email = body.email?.toLowerCase()?.trim()

      if (!email || typeof email !== 'string') {
        return NextResponse.json(
          { error: 'Email is required and must be a string' },
          { status: 400 },
        )
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 },
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      )
    }

    let adminClient
    try {
      adminClient = createAdminClient()
    } catch {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 },
      )
    }

    const { data: users, error: queryError } = await adminClient
      .from('auth_users')
      .select('id')
      .eq('email', email)
      .limit(1)

    if (queryError) {
      try {
        const { data: rpcResult, error: rpcError } = await adminClient.rpc(
          'check_email_exists',
          { email_to_check: email },
        )
        
        if (rpcError) throw rpcError
        
        return NextResponse.json({ exists: rpcResult })
      } catch {
        return NextResponse.json(
          { error: 'Failed to check email availability' },
          { status: 500 },
        )
      }
    }

    const exists = Array.isArray(users) && users.length > 0

    return NextResponse.json({ exists })

  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
