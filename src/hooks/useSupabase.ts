'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useSupabaseQuery<T>(
  table: string,
  query?: string,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        let supabaseQuery = supabase.from(table).select(query || '*')
        
        const { data: result, error } = await supabaseQuery
        
        if (error) {
          setError(error.message)
        } else {
          setData(result || [])
          setError(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, dependencies)

  return { data, loading, error, refetch: () => fetchData() }
}

export function useSupabaseRealtime<T>(
  table: string,
  query?: string,
  filter?: { column: string; value: any }
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let channel: RealtimeChannel

    async function setupRealtime() {
      try {
        // Buscar dados iniciais
        let supabaseQuery = supabase.from(table).select(query || '*')
        
        if (filter) {
          supabaseQuery = supabaseQuery.eq(filter.column, filter.value)
        }
        
        const { data: initialData, error: initialError } = await supabaseQuery
        
        if (initialError) {
          setError(initialError.message)
          return
        }

        setData(initialData || [])
        setLoading(false)

        // Configurar realtime
        channel = supabase
          .channel(`${table}_changes`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: table,
              filter: filter ? `${filter.column}=eq.${filter.value}` : undefined
            },
            (payload) => {
              console.log('Realtime update:', payload)
              
              if (payload.eventType === 'INSERT') {
                setData(prev => [...prev, payload.new as T])
              } else if (payload.eventType === 'UPDATE') {
                setData(prev => prev.map(item => 
                  (item as any).id === payload.new.id ? payload.new as T : item
                ))
              } else if (payload.eventType === 'DELETE') {
                setData(prev => prev.filter(item => 
                  (item as any).id !== payload.old.id
                ))
              }
            }
          )
          .subscribe()

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        setLoading(false)
      }
    }

    setupRealtime()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [table, query, filter?.column, filter?.value])

  return { data, loading, error }
}

export function useSupabaseMutation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const insert = async (table: string, data: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
      
      if (error) {
        setError(error.message)
        return null
      }
      
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      return null
    } finally {
      setLoading(false)
    }
  }

  const update = async (table: string, id: string, data: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
      
      if (error) {
        setError(error.message)
        return null
      }
      
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      return null
    } finally {
      setLoading(false)
    }
  }

  const remove = async (table: string, id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
      
      if (error) {
        setError(error.message)
        return false
      }
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { insert, update, remove, loading, error }
}