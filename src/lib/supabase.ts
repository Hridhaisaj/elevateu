import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Copy .env.example to .env and fill in your values.')
}

// Note: we intentionally do not pass the Database generic here. supabase-js's
// insert/update type inference collapses to `never` with hand-written schema
// types on this version. We keep type-safety at the call sites by casting the
// results of `.select()` to our explicit Row interfaces in src/types/database.ts.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
