'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Kanban, 
  BarChart3, 
  FolderKanban, 
  Users, 
  Settings, 
  User,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
// import SupabaseStatus from './SupabaseStatus' // Temporariamente desabilitado

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Kanban', href: '/kanban', icon: Kanban },
  { name: 'Projetos', href: '/projects', icon: FolderKanban },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
  { name: 'Meu Espaço', href: '/my-space', icon: User },
  { name: 'Equipes', href: '/teams', icon: Users },
  { name: 'Administração', href: '/admin', icon: Settings },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const handleLogout = async () => {
    try {
      // Limpar localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Chamar API de logout para limpar cookies
      await fetch('/api/auth/logout', { method: 'POST' })
      
      // Redirecionar para login
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro no logout:', error)
      // Mesmo com erro, limpar dados locais e redirecionar
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
  }

  return (
    <div className={`sidebar-nav h-screen flex flex-col transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-2 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary-500">PONTA SOLTA</h1>
                <p className="text-xs text-dark-400">v1.0</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-primary-500 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''} ${
                collapsed ? 'justify-center px-2' : ''
              }`}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="w-5 h-5" />
              {!collapsed && <span className="ml-3">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-dark-700">
        {/* Supabase Status - Temporariamente desabilitado */}
        {!collapsed && (
          <div className="mb-3 p-2 bg-dark-700 rounded-lg">
            <div className="flex items-center space-x-2 text-green-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs">Sistema Online</span>
            </div>
          </div>
        )}
        
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-200 truncate">
                Usuário Logado
              </p>
              <p className="text-xs text-dark-400 truncate">
                user@empresa.com
              </p>
            </div>
          )}
        </div>
        
        {!collapsed && (
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center px-3 py-2 text-sm text-dark-400 hover:text-accent-red hover:bg-dark-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </button>
        )}
        
        {collapsed && (
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex justify-center p-2 text-dark-400 hover:text-accent-red hover:bg-dark-700 rounded-lg transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}