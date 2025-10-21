'use client'

import { useState } from 'react'
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabase'
import { Database, RefreshCw, Plus, Trash2 } from 'lucide-react'

export default function SupabaseTest() {
  const [showTest, setShowTest] = useState(false)
  const { data: users, loading, error, refetch } = useSupabaseQuery('users', 'id, name, email, role', [])
  const { insert, remove, loading: mutationLoading } = useSupabaseMutation()

  const handleCreateTestUser = async () => {
    const testUser = {
      id: `test_${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      name: 'Usuário Teste',
      password: 'hashed_password',
      role: 'MEMBER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await insert('users', testUser)
    if (result) {
      refetch()
    }
  }

  const handleDeleteTestUser = async (userId: string) => {
    const success = await remove('users', userId)
    if (success) {
      refetch()
    }
  }

  if (!showTest) {
    return (
      <button
        onClick={() => setShowTest(true)}
        className="flex items-center space-x-2 text-xs text-dark-400 hover:text-primary-500 transition-colors"
      >
        <Database className="w-3 h-3" />
        <span>Testar Supabase</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <h2 className="text-lg font-semibold text-dark-50">Teste de Integração Supabase</h2>
          <button
            onClick={() => setShowTest(false)}
            className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-dark-200"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-primary-500" />
              <span className="text-sm text-dark-200">Status da Conexão</span>
            </div>
            <div className={`text-sm ${error ? 'text-accent-red' : 'text-green-500'}`}>
              {error ? 'Erro' : 'Conectado'}
            </div>
          </div>

          {error && (
            <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg p-3">
              <p className="text-accent-red text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={refetch}
              disabled={loading}
              className="btn-secondary text-sm px-3 py-1"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={handleCreateTestUser}
              disabled={mutationLoading}
              className="btn-primary text-sm px-3 py-1"
            >
              <Plus className="w-3 h-3 mr-1" />
              Criar Teste
            </button>
          </div>

          {/* Users List */}
          <div>
            <h3 className="text-sm font-medium text-dark-200 mb-2">
              Usuários no Supabase ({users.length})
            </h3>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-dark-700 rounded-lg p-3">
                    <div className="h-4 bg-dark-600 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-dark-600 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {users.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between bg-dark-700 rounded-lg p-3">
                    <div>
                      <p className="text-sm text-dark-200">{user.name}</p>
                      <p className="text-xs text-dark-400">{user.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-primary-500/10 text-primary-500 px-2 py-1 rounded">
                        {user.role}
                      </span>
                      {user.email.includes('test') && (
                        <button
                          onClick={() => handleDeleteTestUser(user.id)}
                          disabled={mutationLoading}
                          className="p-1 hover:bg-dark-600 rounded text-dark-400 hover:text-accent-red"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-dark-700 rounded-lg p-3">
            <h4 className="text-sm font-medium text-dark-200 mb-2">Instruções:</h4>
            <ul className="text-xs text-dark-400 space-y-1">
              <li>• Este teste verifica a conexão com o Supabase</li>
              <li>• Você pode criar usuários de teste e removê-los</li>
              <li>• Os dados são sincronizados em tempo real</li>
              <li>• Configure a senha do banco no .env para usar PostgreSQL</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}