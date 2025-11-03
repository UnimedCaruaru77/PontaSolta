import { createClient } from '@supabase/supabase-js'

// Configuração usando as variáveis disponíveis na Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Mock client para desenvolvimento sem Supabase
const createMockClient = () => ({
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({ 
          data: {
            id: 'mock_id',
            title: 'Mock Card',
            description: 'Mock description',
            priority: 'MEDIUM',
            urgency: 'NOT_URGENT',
            high_impact: false,
            is_project: false,
            assignee_id: null,
            start_date: null,
            end_date: null,
            lecom_ticket: null,
            updated_at: new Date().toISOString()
          }, 
          error: null 
        })
      })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: (columns?: string) => ({
          single: () => {
            console.log('Mock Supabase update:', { table, data, column, value })
            return Promise.resolve({ 
              data: {
                id: value,
                ...data,
                updated_at: new Date().toISOString()
              }, 
              error: null 
            })
          }
        })
      })
    }),
    insert: (data: any) => ({
      select: (columns?: string) => ({
        single: () => Promise.resolve({ 
          data: { id: 'new_mock_id', ...data }, 
          error: null 
        })
      })
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ error: null })
    })
  })
})

// Função para criar cliente sob demanda
export function createSupabaseClient() {
  if (supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('Using mock Supabase client for development')
    return createMockClient() as any
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })
}

// Cliente simples para APIs server-side
export const supabaseServerClient = (() => {
  if (supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('Using mock Supabase server client for development')
    return createMockClient() as any
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })
})()