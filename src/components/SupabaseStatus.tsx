'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Wifi, WifiOff, Database, AlertCircle } from 'lucide-react'

export default function SupabaseStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkConnection() {
      try {
        // Testar conexão com uma query simples
        const { data, error } = await supabase
          .from('users')
          .select('count')
          .limit(1)

        if (error) {
          setIsConnected(false)
          setError(error.message)
        } else {
          setIsConnected(true)
          setError(null)
        }
      } catch (err) {
        setIsConnected(false)
        setError(err instanceof Error ? err.message : 'Erro de conexão')
      }
    }

    checkConnection()

    // Verificar conexão a cada 30 segundos
    const interval = setInterval(checkConnection, 30000)

    return () => clearInterval(interval)
  }, [])

  if (isConnected === null) {
    return (
      <div className="flex items-center space-x-2 text-dark-400">
        <Database className="w-4 h-4 animate-pulse" />
        <span className="text-xs">Verificando conexão...</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${
      isConnected ? 'text-green-500' : 'text-accent-red'
    }`}>
      {isConnected ? (
        <>
          <Wifi className="w-4 h-4" />
          <span className="text-xs">Supabase conectado</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span className="text-xs">Supabase desconectado</span>
          {error && (
            <div className="group relative">
              <AlertCircle className="w-4 h-4" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-dark-700 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {error}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}