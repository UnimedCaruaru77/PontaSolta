'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  UserPlus, 
  Settings, 
  Shield, 
  Edit, 
  Trash2, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  EyeOff,
  X
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'TEAM_LEADER' | 'MEMBER'
  sector?: string
  branch?: string
  phone?: string
  lecomUsername?: string
  canOpenTicketsForOthers: boolean
  createdAt: string
  isActive: boolean
}

interface Team {
  id: string
  name: string
  description?: string
  memberCount: number
  parentTeam?: string
  createdAt: string
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'teams' | 'boards'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Dados mockados
  useEffect(() => {
    setTimeout(() => {
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'Luciano Filho',
          email: 'luciano.filho@unimedcaruaru.com.br',
          role: 'ADMIN',
          sector: 'TI',
          branch: 'Matriz',
          phone: '(87) 99999-9999',
          lecomUsername: 'luciano.filho',
          canOpenTicketsForOthers: true,
          createdAt: '2024-01-15',
          isActive: true
        },
        {
          id: '2',
          name: 'Edwa Favre',
          email: 'edwa.favre@hospitalunimedcaruaru.com.br',
          role: 'MEMBER',
          sector: 'TI',
          branch: 'Hospital',
          phone: '(87) 88888-8888',
          lecomUsername: 'edwa.favre',
          canOpenTicketsForOthers: false,
          createdAt: '2024-02-01',
          isActive: true
        },
        {
          id: '3',
          name: 'Marcos Barreto',
          email: 'marcos.barreto@unimedcaruaru.com.br',
          role: 'TEAM_LEADER',
          sector: 'TI',
          branch: 'Matriz',
          phone: '(87) 77777-7777',
          lecomUsername: 'marcos.barreto',
          canOpenTicketsForOthers: true,
          createdAt: '2024-01-20',
          isActive: true
        }
      ]

      const mockTeams: Team[] = [
        {
          id: '1',
          name: 'Service Desk Operadora',
          description: 'Equipe responsável pelo atendimento de primeiro nível',
          memberCount: 5,
          createdAt: '2024-01-10'
        },
        {
          id: '2',
          name: 'NTI Lideranças',
          description: 'Núcleo de Tecnologia da Informação - Lideranças',
          memberCount: 3,
          createdAt: '2024-01-10'
        },
        {
          id: '3',
          name: 'Desenvolvimento',
          description: 'Equipe de desenvolvimento de sistemas',
          memberCount: 4,
          parentTeam: 'NTI Lideranças',
          createdAt: '2024-02-01'
        }
      ]

      setUsers(mockUsers)
      setTeams(mockTeams)
      setLoading(false)
    }, 1000)
  }, [])

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador'
      case 'TEAM_LEADER': return 'Líder de Equipe'
      case 'MEMBER': return 'Membro'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'text-accent-red bg-accent-red/10 border-accent-red/20'
      case 'TEAM_LEADER': return 'text-secondary-500 bg-secondary-500/10 border-secondary-500/20'
      case 'MEMBER': return 'text-primary-500 bg-primary-500/10 border-primary-500/20'
      default: return 'text-dark-400 bg-dark-700 border-dark-600'
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.sector?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const UserModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-xl font-semibold text-dark-50">
            {selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button
            onClick={() => {
              setShowUserModal(false)
              setSelectedUser(null)
            }}
            className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-dark-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Nome</label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="Nome completo"
                defaultValue={selectedUser?.name}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Email</label>
              <input
                type="email"
                className="input-field w-full"
                placeholder="email@empresa.com"
                defaultValue={selectedUser?.email}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Setor</label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="TI, RH, Financeiro..."
                defaultValue={selectedUser?.sector}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Filial</label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="Matriz, Hospital..."
                defaultValue={selectedUser?.branch}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Telefone</label>
              <input
                type="tel"
                className="input-field w-full"
                placeholder="(87) 99999-9999"
                defaultValue={selectedUser?.phone}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Usuário LECOM</label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="usuario.lecom"
                defaultValue={selectedUser?.lecomUsername}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">Perfil</label>
            <select className="input-field w-full" defaultValue={selectedUser?.role}>
              <option value="MEMBER">Membro</option>
              <option value="TEAM_LEADER">Líder de Equipe</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="canOpenTickets"
              className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded"
              defaultChecked={selectedUser?.canOpenTicketsForOthers}
            />
            <label htmlFor="canOpenTickets" className="text-sm text-dark-200">
              Pode abrir chamados LECOM para outros usuários
            </label>
          </div>

          {!selectedUser && (
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Senha</label>
              <input
                type="password"
                className="input-field w-full"
                placeholder="Senha inicial"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-dark-700">
          <button
            onClick={() => {
              setShowUserModal(false)
              setSelectedUser(null)
            }}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button className="btn-primary">
            {selectedUser ? 'Salvar Alterações' : 'Criar Usuário'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-50">Administração</h1>
          <p className="text-dark-400 mt-1">
            Gerenciar usuários, equipes e configurações do sistema
          </p>
        </div>
        <button
          onClick={() => setShowUserModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 bg-dark-800 border border-dark-700 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-primary-500 text-white'
              : 'text-dark-400 hover:text-dark-200'
          }`}
        >
          <Users className="w-4 h-4 mr-2 inline" />
          Usuários ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'teams'
              ? 'bg-primary-500 text-white'
              : 'text-dark-400 hover:text-dark-200'
          }`}
        >
          <Users className="w-4 h-4 mr-2 inline" />
          Equipes ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab('boards')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'boards'
              ? 'bg-primary-500 text-white'
              : 'text-dark-400 hover:text-dark-200'
          }`}
        >
          <Settings className="w-4 h-4 mr-2 inline" />
          Quadros
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
          <input
            type="text"
            placeholder={`Buscar ${activeTab === 'users' ? 'usuários' : 'equipes'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-80"
          />
        </div>
        <button className="btn-secondary">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </button>
      </div>

      {/* Content */}
      {activeTab === 'users' && (
        <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700 border-b border-dark-600">
                <tr>
                  <th className="text-left p-4 text-dark-200 font-medium">Usuário</th>
                  <th className="text-left p-4 text-dark-200 font-medium">Perfil</th>
                  <th className="text-left p-4 text-dark-200 font-medium">Setor/Filial</th>
                  <th className="text-left p-4 text-dark-200 font-medium">LECOM</th>
                  <th className="text-left p-4 text-dark-200 font-medium">Status</th>
                  <th className="text-right p-4 text-dark-200 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-dark-700">
                      <td className="p-4">
                        <div className="animate-pulse flex items-center space-x-3">
                          <div className="w-10 h-10 bg-dark-600 rounded-full"></div>
                          <div>
                            <div className="h-4 bg-dark-600 rounded w-32 mb-1"></div>
                            <div className="h-3 bg-dark-600 rounded w-48"></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4"><div className="animate-pulse h-4 bg-dark-600 rounded w-20"></div></td>
                      <td className="p-4"><div className="animate-pulse h-4 bg-dark-600 rounded w-24"></div></td>
                      <td className="p-4"><div className="animate-pulse h-4 bg-dark-600 rounded w-16"></div></td>
                      <td className="p-4"><div className="animate-pulse h-4 bg-dark-600 rounded w-12"></div></td>
                      <td className="p-4"><div className="animate-pulse h-4 bg-dark-600 rounded w-16"></div></td>
                    </tr>
                  ))
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-dark-700 hover:bg-dark-700/50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-dark-50">{user.name}</p>
                            <p className="text-dark-400 text-sm">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p className="text-dark-200">{user.sector}</p>
                          <p className="text-dark-400">{user.branch}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1">
                          <span className="text-dark-300 text-sm">{user.lecomUsername}</span>
                          {user.canOpenTicketsForOthers && (
                            <Shield className="w-3 h-3 text-accent-yellow" title="Pode abrir chamados para outros" />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          user.isActive 
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                            : 'bg-accent-red/10 text-accent-red border border-accent-red/20'
                        }`}>
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowUserModal(true)
                            }}
                            className="p-1 hover:bg-dark-600 rounded text-dark-400 hover:text-primary-500"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1 hover:bg-dark-600 rounded text-dark-400 hover:text-accent-red"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-dark-800 border border-dark-700 rounded-lg p-6">
                <div className="h-5 bg-dark-600 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-dark-600 rounded w-full mb-4"></div>
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-dark-600 rounded w-20"></div>
                  <div className="h-4 bg-dark-600 rounded w-16"></div>
                </div>
              </div>
            ))
          ) : (
            filteredTeams.map(team => (
              <div key={team.id} className="bg-dark-800 border border-dark-700 rounded-lg p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-dark-50">{team.name}</h3>
                  <button className="p-1 hover:bg-dark-700 rounded text-dark-400 hover:text-dark-200">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-dark-400 text-sm mb-4 line-clamp-2">
                  {team.description}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1 text-dark-300">
                    <Users className="w-4 h-4" />
                    <span>{team.memberCount} membros</span>
                  </div>
                  
                  {team.parentTeam && (
                    <span className="text-xs text-secondary-500 bg-secondary-500/10 px-2 py-1 rounded">
                      Sub-equipe
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          
          <button className="bg-dark-800 border-2 border-dashed border-dark-600 rounded-lg p-6 hover:border-primary-500 hover:bg-dark-700 transition-all duration-200 flex flex-col items-center justify-center text-dark-400 hover:text-primary-500">
            <Plus className="w-8 h-8 mb-2" />
            <span className="font-medium">Nova Equipe</span>
          </button>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && <UserModal />}
    </div>
  )
}