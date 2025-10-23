import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se há dados do usuário no localStorage
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        // Usar dados do usuário salvos diretamente
        const user = JSON.parse(userData)
        setUser({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        })
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    
    setLoading(false)
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/login'
  }

  return {
    user,
    loading,
    logout,
    isAuthenticated: !!user
  }
}