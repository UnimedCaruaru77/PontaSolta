import { createClient } from '@supabase/supabase-js'

// Configuração usando as variáveis disponíveis na Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Verificar se estamos em produção e as variáveis são necessárias
if (process.env.NODE_ENV === 'production' && (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co')) {
  console.warn('Supabase URL not configured, running in mock mode')
}

// Global singleton para evitar múltiplas instâncias durante hot reload
const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createClient> | undefined
  supabaseAdmin: ReturnType<typeof createClient> | undefined
}

// Criar cliente apenas se as URLs são válidas
let supabaseClient: ReturnType<typeof createClient> | null = null
let supabaseAdminClient: ReturnType<typeof createClient> | null = null

try {
  if (supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co') {
    supabaseClient = globalForSupabase.supabase ?? createClient(supabaseUrl, supabaseAnonKey, {
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

    supabaseAdminClient = globalForSupabase.supabaseAdmin ?? createClient(
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
} catch (error) {
  console.warn('Supabase client creation failed, using mock mode:', error)
}

export const supabase = supabaseClient
export const supabaseAdmin = supabaseAdminClient

// Armazenar na global apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production' && supabaseClient && supabaseAdminClient) {
  globalForSupabase.supabase = supabaseClient
  globalForSupabase.supabaseAdmin = supabaseAdminClient
}

// Função helper para verificar se o Supabase está disponível
export const isSupabaseAvailable = () => {
  return supabaseClient !== null && supabaseAdminClient !== null
}

// Mock client para desenvolvimento sem Supabase
export const createMockSupabaseResponse = (data: any = null, error: any = null) => {
  return Promise.resolve({ data, error })
}