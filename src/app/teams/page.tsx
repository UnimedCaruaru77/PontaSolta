'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  Crown,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  X
} from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'LEADER' | 'MEMBER'
  sector?: string
  branch?: string
  phone?: string
  joinedAt: string
  isActive: boolean
}

interface Team {
  id: string
  name: string
  description?: string
  parentTeamId?: string
  parentTeamName?: string
  members: TeamMember[]
  createdAt: string
  isActive: boolean
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)

  // Dados mockados
  useEffect(() => {
    setTimeout(() => {
      const mockTeams: Team[] = [
        {
          id: '1',
          name: 'Service Desk Operadora',
          description: 'Equipe responsável pelo atendimento de primeiro nível aos usuários internos e externos',
          members: [
            {
              id: '1',
              name: 'Luciano Filho',
              email: 'luciano.filho@unimedcaruaru.com.br',
              role: 'LEADER',
              sector: 'TI',
              branch: 'Matriz',
              phone: '(87) 99999-9999',
              joinedAt: '2024-01-15',
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
              joinedAt: '2024-02-01',
              isActive: true
            }
          ],
          createdAt: '2024-01-10',
          isActive: true
        },
        {
          id: '2',
          name: 'NTI Lideranças',
          description: 'Núcleo de Tecnologia da Informação - Equipe de lideranças estratégicas',
          members: [
            {
              id: '1',
              name: 'Luciano Filho',
              email: 'luciano.filho@unimedcaruaru.com.br',
              role: 'LEADER',
              sector: 'TI',
              branch: 'Matriz',
              phone: '(87) 99999-9999',
              joinedAt: '2024-01-10',
              isActive: true
            },
            {
              id: '3',
              name: 'Marcos Barreto',
              email: 'marcos.barreto@unimedcaruaru.com.br',
              role: 'MEMBER',
              sector: 'TI',
              branch: 'Matriz',
              phone: '(87) 77777-7777',
              joinedAt: '2024-01-20',
              isActive: true
            }
          ],
          createdAt: '2024-01-10',
          isActive: true
        },
        {
          id: '3',
          name: 'Desenvolvimento',
          description: 'Equipe de desenvolvimento de sistemas e aplicações',
          parentTeamId: '2',
          parentTeamName: 'NTI Lideranças',
          members: [
            {
              id: '4',
              name: 'Ana Silva',
              email: 'ana.silva@unimedcaruaru.com.br',
              role: 'LEADER',
              sector: 'TI',
              branch: 'Matriz',
              phone: '(87) 66666-6666',
              joinedAt: '2024-02-01',
              isActive: true
            },
            {
              id: '5',
              name: 'João Santos',
              email: 'joao.santos@unimedcaruaru.com.br',
              role: 'MEMBER',
              sector: 'TI',
              branch: 'Matriz',
              phone: '(87) 55555-5555',
              joinedAt: '2024-02-15',
              isActive: true
            }
          ],
          createdAt: '2024-02-01',
          isActive: true
        }
      ]
      setTeams(mockTeams)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.members.some(member => 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const TeamCard = ({ team }: { team: Team }) => {
    const leaders = team.members.filter(member => member.role === 'LEADER')
    const members = team.members.filter(member => member.role === 'MEMBER')

    return (
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-dark-50">{team.name}</h3>
              {team.parentTeamName && (
                <span className="text-xs bg-secondary-500/10 text-secondary-500 px-2 py-1 rounded border border-secondary-500/20">
                  Sub-equipe de {team.parentTeamName}
                </span>
              )}
            </div>
            <p className="text-dark-400 text-sm line-clamp-2 mb-3">
              {team.description}
            </p>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setSelectedTeam(team)}
              className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-primary-500 transition-colors"
              title="Ver detalhes"
            >
              <Users className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-dark-200 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-dark-700 rounded-lg">
          <div className="text-center">
            <p className="text-lg font-bold text-primary-500">{team.members.length}</p>
            <p className="text-xs text-dark-400">Membros</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-secondary-500">{leaders.length}</p>
            <p className="text-xs text-dark-400">Líderes</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-500">{team.members.filter(m => m.isActive).length}</p>
            <p className="text-xs text-dark-400">Ativos</p>
          </div>
        </div>

        {/* Team Members Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-dark-200">Membros</span>
            <button
              onClick={() => {
                setSelectedTeam(team)
                setShowMemberModal(true)
              }}
              className="text-xs text-primary-500 hover:text-primary-400"
            >
              + Adicionar
            </button>
          </div>
          
          <div className="space-y-1">
            {team.members.slice(0, 3).map(member => (
              <div key={member.id} className="flex items-center space-x-2 p-2 bg-dark-700 rounded-lg">
                <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 1)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <p className="text-sm text-dark-200 truncate">{member.name}</p>
                    {member.role === 'LEADER' && (
                      <Crown className="w-3 h-3 text-accent-yellow" />
                    )}
                  </div>
                  <p className="text-xs text-dark-400 truncate">{member.email}</p>
                </div>
              </div>
            ))}
            
            {team.members.length > 3 && (
              <div className="text-center py-2">
                <button
                  onClick={() => setSelectedTeam(team)}
                  className="text-xs text-primary-500 hover:text-primary-400"
                >
                  Ver mais {team.members.length - 3} membros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const TeamDetailModal = () => {
    if (!selectedTeam) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-dark-700">
            <div>
              <h2 className="text-xl font-semibold text-dark-50">{selectedTeam.name}</h2>
              <p className="text-dark-400 text-sm mt-1">{selectedTeam.description}</p>
            </div>
            <button
              onClick={() => setSelectedTeam(null)}
              className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-dark-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-dark-50">
                Membros da Equipe ({selectedTeam.members.length})
              </h3>
              <button
                onClick={() => setShowMemberModal(true)}
                className="btn-primary"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Membro
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTeam.members.map(member => (
                <div key={member.id} className="bg-dark-700 border border-dark-600 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-dark-50">{member.name}</h4>
                          {member.role === 'LEADER' && (
                            <Crown className="w-4 h-4 text-accent-yellow" />
                          )}
                        </div>
                        <p className="text-sm text-dark-400">{member.role === 'LEADER' ? 'Líder' : 'Membro'}</p>
                      </div>
                    </div>
                    <button className="p-1 hover:bg-dark-600 rounded text-dark-400 hover:text-dark-200">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-dark-300">
                      <Mail className="w-3 h-3" />
                      <span>{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center space-x-2 text-dark-300">
                        <Phone className="w-3 h-3" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-dark-300">
                      <Building className="w-3 h-3" />
                      <span>{member.sector} - {member.branch}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-dark-400">
                      <Calendar className="w-3 h-3" />
                      <span>Desde {new Date(member.joinedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-50">Equipes</h1>
          <p className="text-dark-400 mt-1">
            Gerencie equipes e seus membros
          </p>
        </div>
        <button
          onClick={() => setShowTeamModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Equipe
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar equipes ou membros..."
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

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-dark-800 border border-dark-700 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-5 bg-dark-600 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-dark-600 rounded w-full mb-2"></div>
                  <div className="h-4 bg-dark-600 rounded w-2/3"></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-dark-700 rounded-lg">
                <div className="h-8 bg-dark-600 rounded"></div>
                <div className="h-8 bg-dark-600 rounded"></div>
                <div className="h-8 bg-dark-600 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-dark-600 rounded w-20"></div>
                <div className="h-12 bg-dark-600 rounded"></div>
                <div className="h-12 bg-dark-600 rounded"></div>
              </div>
            </div>
          ))
        ) : filteredTeams.length > 0 ? (
          filteredTeams.map(team => (
            <TeamCard key={team.id} team={team} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-dark-400" />
            </div>
            <h3 className="text-lg font-medium text-dark-300 mb-2">
              Nenhuma equipe encontrada
            </h3>
            <p className="text-dark-500 mb-4">
              {searchTerm
                ? 'Nenhuma equipe corresponde à sua busca.'
                : 'Comece criando sua primeira equipe.'
              }
            </p>
            <button
              onClick={() => setShowTeamModal(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Equipe
            </button>
          </div>
        )}
      </div>

      {/* Team Detail Modal */}
      {selectedTeam && !showMemberModal && <TeamDetailModal />}
    </div>
  )
}