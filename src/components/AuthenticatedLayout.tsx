'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Páginas que não precisam de autenticação
  const publicPages = useMemo(() => ['/login', '/'], [])

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token')
        const isPublicPage = publicPages.includes(pathname)
        
        if (!token && !isPublicPage) {
          router.push('/login')
          return
        }
        
        setIsAuthenticated(!!token)
      } catch (error) {
        console.error('Auth check error:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    // Pequeno delay para evitar flash de conteúdo
    const timer = setTimeout(checkAuth, 100)
    
    return () => clearTimeout(timer)
  }, [pathname, router, publicPages])

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // Se não está autenticado e não é página pública, não renderizar nada
  if (!isAuthenticated && !publicPages.includes(pathname)) {
    return null
  }

  // Se é página pública, renderizar sem sidebar
  if (publicPages.includes(pathname)) {
    return <>{children}</>
  }

  // Se está autenticado, renderizar com sidebar
  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}