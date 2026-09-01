import { createClient } from '@supabase/supabase-js'

// Server-only Supabase client using the service_role key. This bypasses Row
// Level Security, so it must NEVER be imported from client components and the
// key must NEVER be exposed with a NEXT_PUBLIC_ prefix.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let cachedClient: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase admin environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin operations.',
    )
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })
  }

  return cachedClient
}
