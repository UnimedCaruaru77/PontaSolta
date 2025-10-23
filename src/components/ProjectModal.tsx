'use client'

import { useState } from 'react'
import { 
  X, 
  Calendar, 
  Users, 
  BarChart3,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  FolderKanban,
  Edit,
  Save
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

interface ProjectModalProps {
  project: Project
  isOpen: boolean
  onClose: () => void
  onSave?: (project: Project) => void
}

export default function ProjectModal({ project, isOpen, onClose, onSave }: ProjectModalProps) {
  const [formData, setFormData] = useState<Project>(project)
  const [isEditing, setIsEditing] = useState(false)

  if (!isOpen) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'text-blue-500'
      case 'IN_PROGRESS': return 'text-yellow-500'
      case 'REVIEW': return 'text-purple-500'
      case 'COMPLETED': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'Planejamento'
      case 'IN_PROGRESS': return 'Em Andamento'
      case 'REVIEW': return 'Em Revisão'
      case 'COMPLETED': return 'Concluído'
      default: return status
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

  const handleSave = () => {
    if (onSave) {
      onSave(formData)
    }
    setIsEditing(false)
  }

  const handleViewKanban = () => {
    // Navegar para o Kanban do projeto
    window.location.href = `/kanban?project=${project.id}`
  }

  const handleViewReport = () => {
    // Navegar para o relatório do projeto
    window.location.href = `/reports?project=${project.id}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div className="flex items-center space-x-3">
            <FolderKanban className="w-6 h-6 text-secondary-500" />
            {isEditing ? (
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="text-xl font-semibold bg-transparent border-none outline-none text-dark-50 flex-1"
              />
            ) : (
              <h2 className="text-xl font-semibold text-dark-50">{project.title}</h2>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary px-3 py-1"
              >
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="btn-primary px-3 py-1"
              >
                <Save className="w-4 h-4 mr-1" />
                Salvar
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-dark-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Status e Progresso */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </div>
                  <div className="text-sm text-dark-400">
                    {getMethodologyLabel(project.methodology)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-500">{project.progress}%</div>
                  <div className="text-xs text-dark-400">Progresso</div>
                </div>
              </div>
              
              {/* Barra de Progresso */}
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Descrição */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Descrição do Projeto
              </label>
              {isEditing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field w-full h-24 resize-none"
                />
              ) : (
                <p className="text-dark-300 leading-relaxed">{project.description}</p>
              )}
            </div>

            {/* Timeline */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark-200 mb-3">
                Timeline do Projeto
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-dark-700 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-xs text-dark-400">Data de Início</p>
                    <p className="text-sm text-dark-200">
                      {new Date(project.startDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-dark-700 rounded-lg">
                  <Calendar className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-xs text-dark-400">Data de Término</p>
                    <p className="text-sm text-dark-200">
                      {new Date(project.endDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Colaboradores */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark-200 mb-3">
                Equipe do Projeto
              </label>
              
              {/* Owner */}
              <div className="mb-3">
                <div className="flex items-center space-x-3 p-3 bg-dark-700 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-200 font-medium">{project.owner.name}</p>
                    <p className="text-xs text-dark-400">Proprietário do Projeto</p>
                  </div>
                </div>
              </div>

              {/* Colaboradores */}
              {project.collaborators.length > 0 && (
                <div className="space-y-2">
                  {project.collaborators.map(collaborator => (
                    <div key={collaborator.id} className="flex items-center space-x-3 p-3 bg-dark-700 rounded-lg">
                      <div className="w-8 h-8 bg-dark-600 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-dark-400" />
                      </div>
                      <div>
                        <p className="text-sm text-dark-200">{collaborator.name}</p>
                        <p className="text-xs text-dark-400">{collaborator.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l border-dark-700 p-6 overflow-y-auto">
            {/* Métricas */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-dark-200 mb-3">Métricas do Projeto</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-primary-500" />
                    <span className="text-sm text-dark-300">Prioridade</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    project.priority === 'HIGH' ? 'text-red-500' :
                    project.priority === 'MEDIUM' ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {project.priority === 'HIGH' ? 'Alta' : 
                     project.priority === 'MEDIUM' ? 'Média' : 'Baixa'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-dark-300">Duração</span>
                  </div>
                  <span className="text-sm text-dark-200">
                    {Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} dias
                  </span>
                </div>

                {project.budget && (
                  <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-dark-300">Orçamento</span>
                    </div>
                    <span className="text-sm text-dark-200">
                      R$ {project.budget.toLocaleString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-2">
              <button onClick={handleViewKanban} className="btn-primary w-full justify-center">
                <FolderKanban className="w-4 h-4 mr-2" />
                Ver no Kanban
              </button>
              
              <button onClick={handleViewReport} className="btn-secondary w-full justify-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Relatório do Projeto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}