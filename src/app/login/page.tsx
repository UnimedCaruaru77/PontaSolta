'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Zap } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    console.log('Frontend: Submitting login form', { email })

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      console.log('Frontend: Response status', response.status)
      console.log('Frontend: Response headers', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        console.log('Frontend: Login successful, redirecting to dashboard', data)
        
        // Verificar se o cookie foi definido
        console.log('Frontend: Document cookies:', document.cookie)
        
        // Aguardar um pouco para o cookie ser processado
        await new Promise(resolve => setTimeout(resolve, 500))
        
        console.log('Frontend: Executing redirect now')
        console.log('Frontend: Current location:', window.location.href)
        
        // Redirecionamento para dashboard principal
        console.log('Frontend: Redirecting to dashboard')
        window.location.href = '/dashboard'
      } else {
        const data = await response.json()
        console.log('Frontend: Login failed', data)
        setError(data.message || 'Erro ao fazer login')
      }
    } catch (error) {
      console.error('Frontend: Login error', error)
      setError('Erro de conexão')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e título */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-3 rounded-xl">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
            PONTA SOLTA
          </h1>
          <p className="text-dark-400 mt-2">
            Controle de Demandas & Gestão de Projetos
          </p>
        </div>

        {/* Formulário de login */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-200 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full"
                placeholder="seu.email@empresa.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-200 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg p-3">
                <p className="text-accent-red text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Informações de teste */}
          <div className="mt-6 pt-6 border-t border-dark-700">
            <p className="text-xs text-dark-400 text-center">
              Usuário admin: luciano.filho@unimedcaruaru.com.br
            </p>
            <p className="text-xs text-dark-400 text-center">
              Senha: Mudar@123
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-dark-500">
            Powered by AI Technology • v1.0
          </p>
        </div>
      </div>
    </div>
  )
}