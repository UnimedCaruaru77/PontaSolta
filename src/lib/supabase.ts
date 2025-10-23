import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Singleton pattern para evitar múltiplas instâncias
let supabaseInstance: ReturnType<typeof createClient> | null = null
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
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
  }
  return supabaseInstance
})()

// Cliente para operações server-side
export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
  return supabaseAdminInstance
})()