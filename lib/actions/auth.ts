'use server'

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Server action to check email availability
 * This is more secure than client-side API calls
 */
export async function checkEmailAvailability(email: string): Promise<{
  available: boolean
  error?: string
}> {
  try {
    const normalizedEmail = email.toLowerCase().trim()
    
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return { available: false, error: 'Invalid email format' }
    }

    const adminClient = createAdminClient()

    // Try the RPC function first (most secure)
    const { data: rpcResult, error: rpcError } = await adminClient.rpc(
      'check_email_exists',
      { email_to_check: normalizedEmail },
    )

    if (!rpcError && typeof rpcResult === 'boolean') {
      return { available: !rpcResult }
    }

    // Fallback: query directly (requires proper permissions)
    const { data: users, error: queryError } = await adminClient
      .from('auth_users')
      .select('id')
      .eq('email', normalizedEmail)
      .limit(1)

    if (queryError) {
      console.error('Error checking email availability:', queryError)
      return { available: false, error: 'Failed to check email' }
    }

    const exists = Array.isArray(users) && users.length > 0
    return { available: !exists }
  } catch (error) {
    console.error('Unexpected error in checkEmailAvailability:', error)
    return { available: false, error: 'Server error' }
  }
}
