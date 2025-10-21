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
    // Verificar se há um token JWT no localStorage
    const token = localStorage.getItem('token')
    
    if (token) {
      try {
        // Decodificar o JWT para obter informações do usuário
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({
          id: payload.userId,
          name: payload.name,
          email: payload.email,
          role: payload.role
        })
      } catch (error) {
        console.error('Erro ao decodificar token:', error)
        localStorage.removeItem('token')
      }
    }
    
    setLoading(false)
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
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