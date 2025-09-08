// API-specific Supabase client for server-side operations
import { createClient } from '@supabase/supabase-js'

// Create a service role client for API routes that bypasses RLS
export function createAPIClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Create a regular client for user authentication
export function createUserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Helper function to authenticate API requests using Bearer tokens
export async function authenticateAPIRequest(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'No valid Authorization header' }
  }

  const token = authHeader.split(' ')[1]
  const supabase = createUserClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    return { user, error }
  } catch (error) {
    return { user: null, error: 'Invalid token' }
  }
}