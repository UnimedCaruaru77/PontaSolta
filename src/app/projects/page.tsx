'use client'

import { useState, useEffect } from 'react'
import { 
  FolderKanban, 
  Calendar, 
  Users, 
  BarChart3, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target
} from 'lucide-react'

interface Project {
  id: string
  title: string
  description: string
  methodology: 'AGILE' | 'LEAN_STARTUP' | 'DESIGN_THINKING' | 'PMI'
  status: 'PLANNING' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'
  progress: number
  startDate: string
  endDate: string
  team: string
  owner: {
    id: string
    name: string
    email: string
  }
  collaborators: Array<{
    id: string
    name: string
    role: string
  }>
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  budget?: number
  createdAt: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterMethodology, setFilterMethodology] = useState<string>('all')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  // Dados mockados
  useEffect(() => {
    setTimeout(() => {
      const mockProjects: Project[] = [
        {
          id: '1',
          title: 'Implementação do novo ERP',
          description: 'Projeto estratégico para modernização dos sistemas da empresa com foco em integração e automação de processos.',
          methodology: 'PMI',
          status: 'IN_PROGRESS',
          progress: 35,
          startDate: '2024-10-01',
          endDate: '2025-03-01',
          team: 'NTI Lideranças',
          owner: { id: '1', name: 'Luciano Filho', email: 'luciano.filho@unimed.com' },
          collaborators: [
            { id: '2', name: 'Marcos Barreto', role: 'Gerente de Projeto' },
            { id: '3', name: 'Edwa Favre', role: 'Desenvolvedor' }
          ],
          priority: 'HIGH',
          budget: 150000,
          createdAt: '2024-09-15'
        },
        {
          id: '2',
          title: 'Portal do Paciente Mobile',
          description: 'Desenvolvimento de aplicativo mobile para acesso dos pacientes aos serviços da Unimed.',
          methodology: 'AGILE',
          status: 'PLANNING',
          progress: 10,
          startDate: '2024-11-01',
          endDate: '2025-02-01',
          team: 'Desenvolvimento',
          owner: { id: '3', name: 'Marcos Barreto', email: 'marcos.barreto@unimed.com' },
          collaborators: [
            { id: '4', name: 'Ana Silva', role: 'UX Designer' },
            { id: '5', name: 'João Santos', role: 'Desenvolvedor Mobile' }
          ],
          priority: 'MEDIUM',
          budget: 80000,
          createdAt: '2024-10-10'
        },
        {
          id: '3',
          title: 'Automação de Processos RH',
          description: 'Implementação de workflows automatizados para processos de recursos humanos.',
          methodology: 'LEAN_STARTUP',
          status: 'REVIEW',
          progress: 85,
          startDate: '2024-08-01',
          endDate: '2024-12-01',
          team: 'Service Desk Operadora',
          owner: { id: '2', name: 'Edwa Favre', email: 'edwa.favre@hospital.com' },
          collaborators: [
            { id: '6', name: 'Maria Costa', role: 'Analista de Processos' }
          ],
          priority: 'LOW',
          createdAt: '2024-07-20'
        }
      ]
      setProjects(mockProjects)
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'Planejamento'
      case 'IN_PROGRESS': return 'Em Andamento'
      case 'REVIEW': return 'Em Revisão'
      case 'COMPLETED': return 'Concluído'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/20'
      case 'IN_PROGRESS': return 'text-primary-500 bg-primary-500/10 border-primary-500/20'
      case 'REVIEW': return 'text-secondary-500 bg-secondary-500/10 border-secondary-500/20'
      case 'COMPLETED': return 'text-green-500 bg-green-500/10 border-green-500/20'
      default: return 'text-dark-400 bg-dark-700 border-dark-600'
    }
  }

  const getMethodologyLabel = (methodology: string) => {
    switch (methodology) {
      case 'AGILE': return 'Ágil'
      case 'LEAN_STARTUP': return 'Lean Startup'
      case 'DESIGN_THINKING': return 'Design Thinking'
      case 'PMI': return 'PMI'
      default: return methodology
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-accent-red'
      case 'MEDIUM': return 'text-accent-orange'
      case 'LOW': return 'text-green-500'
      default: return 'text-dark-400'
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.team.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus
    const matchesMethodology = filterMethodology === 'all' || project.methodology === filterMethodology
    
    return matchesSearch && matchesStatus && matchesMethodology
  })

  const ProjectCard = ({ project }: { project: Project }) => (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-semibold text-dark-50 text-lg">{project.title}</h3>
            <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </span>
          </div>
          <p className="text-dark-400 text-sm line-clamp-2 mb-3">
            {project.description}
          </p>
        </div>
        <button className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-dark-200 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-dark-300">Progresso</span>
          <span className="text-sm font-medium text-primary-500">{project.progress}%</span>
        </div>
        <div className="w-full bg-dark-700 rounded-full h-2">
          <div 
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <div className="flex items-center space-x-1 text-dark-400 mb-1">
            <Calendar className="w-3 h-3" />
            <span>Prazo</span>
          </div>
          <p className="text-dark-200">{new Date(project.endDate).toLocaleDateString('pt-BR')}</p>
        </div>
        <div>
          <div className="flex items-center space-x-1 text-dark-400 mb-1">
            <Target className="w-3 h-3" />
            <span>Metodologia</span>
          </div>
          <p className="text-dark-200">{getMethodologyLabel(project.methodology)}</p>
        </div>
      </div>

      {/* Team and Priority */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex -space-x-2">
            {project.collaborators.slice(0, 3).map((collaborator, index) => (
              <div
                key={collaborator.id}
                className="w-6 h-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full border-2 border-dark-800 flex items-center justify-center"
                title={collaborator.name}
              >
                <span className="text-white text-xs font-medium">
                  {collaborator.name.split(' ').map(n => n[0]).join('').slice(0, 1)}
                </span>
              </div>
            ))}
            {project.collaborators.length > 3 && (
              <div className="w-6 h-6 bg-dark-600 rounded-full border-2 border-dark-800 flex items-center justify-center">
                <span className="text-dark-300 text-xs">+{project.collaborators.length - 3}</span>
              </div>
            )}
          </div>
          <span className="text-xs text-dark-400">{project.team}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getPriorityColor(project.priority).replace('text-', 'bg-')}`}></div>
          <span className="text-xs text-dark-400">
            {project.priority === 'HIGH' ? 'Alta' : project.priority === 'MEDIUM' ? 'Média' : 'Baixa'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-dark-700 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setSelectedProject(project)}
          className="btn-primary text-sm px-3 py-1"
        >
          <Eye className="w-3 h-3 mr-1" />
          Ver Detalhes
        </button>
        <button className="btn-secondary text-sm px-3 py-1">
          <Edit className="w-3 h-3 mr-1" />
          Editar
        </button>
      </div>
    </div>
  )

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color,
    subtitle 
  }: { 
    title: string
    value: number | string
    icon: any
    color: string
    subtitle?: string
  }) => (
    <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-dark-400 text-sm">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>
            {loading ? (
              <div className="animate-pulse bg-dark-600 h-6 w-12 rounded"></div>
            ) : (
              value
            )}
          </p>
          {subtitle && (
            <p className="text-xs text-dark-500 mt-1">{subtitle}</p>
          )}
        </div>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-50">Projetos</h1>
          <p className="text-dark-400 mt-1">
            Gerencie e acompanhe todos os projetos da organização
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Novo Projeto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total de Projetos"
          value={projects.length}
          icon={FolderKanban}
          color="text-primary-500"
        />
        <StatCard
          title="Em Andamento"
          value={projects.filter(p => p.status === 'IN_PROGRESS').length}
          icon={Clock}
          color="text-accent-orange"
        />
        <StatCard
          title="Concluídos"
          value={projects.filter(p => p.status === 'COMPLETED').length}
          icon={CheckCircle}
          color="text-green-500"
        />
        <StatCard
          title="Progresso Médio"
          value={`${Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length || 0)}%`}
          icon={BarChart3}
          color="text-secondary-500"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-80"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field"
          >
            <option value="all">Todos os Status</option>
            <option value="PLANNING">Planejamento</option>
            <option value="IN_PROGRESS">Em Andamento</option>
            <option value="REVIEW">Em Revisão</option>
            <option value="COMPLETED">Concluído</option>
          </select>

          <select
            value={filterMethodology}
            onChange={(e) => setFilterMethodology(e.target.value)}
            className="input-field"
          >
            <option value="all">Todas as Metodologias</option>
            <option value="AGILE">Ágil</option>
            <option value="LEAN_STARTUP">Lean Startup</option>
            <option value="DESIGN_THINKING">Design Thinking</option>
            <option value="PMI">PMI</option>
          </select>
        </div>

        <button className="btn-secondary">
          <Filter className="w-4 h-4 mr-2" />
          Mais Filtros
        </button>
      </div>

      {/* Projects Grid */}
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
              <div className="h-2 bg-dark-600 rounded w-full mb-4"></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="h-4 bg-dark-600 rounded"></div>
                <div className="h-4 bg-dark-600 rounded"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 bg-dark-600 rounded w-24"></div>
                <div className="h-4 bg-dark-600 rounded w-16"></div>
              </div>
            </div>
          ))
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-8 h-8 text-dark-400" />
            </div>
            <h3 className="text-lg font-medium text-dark-300 mb-2">
              Nenhum projeto encontrado
            </h3>
            <p className="text-dark-500 mb-4">
              {searchTerm || filterStatus !== 'all' || filterMethodology !== 'all'
                ? 'Nenhum projeto corresponde aos filtros selecionados.'
                : 'Comece criando seu primeiro projeto.'
              }
            </p>
            <button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Projeto
            </button>
          </div>
        )}
      </div>
    </div>
  )
}