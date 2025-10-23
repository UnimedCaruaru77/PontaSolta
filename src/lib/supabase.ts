import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Global singleton para evitar múltiplas instâncias durante hot reload
const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createClient> | undefined
  supabaseAdmin: ReturnType<typeof createClient> | undefined
}

export const supabase = globalForSupabase.supabase ?? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'ponta-solta-auth'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

export const supabaseAdmin = globalForSupabase.supabaseAdmin ?? createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Armazenar na global apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase
  globalForSupabase.supabaseAdmin = supabaseAdmin
}