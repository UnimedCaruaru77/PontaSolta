'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  // Páginas que não precisam de autenticação
  const publicPages = ['/login', '/']

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      
      if (!token && !publicPages.includes(pathname)) {
        router.push('/login')
        return
      }
      
      setIsAuthenticated(!!token)
    }

    checkAuth()
  }, [pathname, router])

  // Mostrar loading enquanto verifica autenticação
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // Se não está autenticado e não é página pública, não renderizar nada (redirecionamento já foi feito)
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