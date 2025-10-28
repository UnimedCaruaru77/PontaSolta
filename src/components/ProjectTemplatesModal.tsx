'use client'

import { useState, useEffect } from 'react'
import { 
  FileTemplate, 
  Plus, 
  Search, 
  Filter,
  Star,
  Clock,
  Users,
  Calendar,
  CheckCircle,
  Copy,
  Edit,
  Trash2
} from 'lucide-react'
import ResponsiveModal from './ResponsiveModal'
import { useToast } from './ToastContainer'

interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: string
  methodology: 'AGILE' | 'WATERFALL' | 'KANBAN' | 'SCRUM'
  estimatedDuration: number // em dias
  teamSize: number
  complexity: 'LOW' | 'MEDIUM' | 'HIGH'
  tags: string[]
  tasks: TemplateTask[]
  isPublic: boolean
  isFavorite: boolean
  usageCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface TemplateTask {
  id: string
  title: string
  description: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  estimatedHours: number
  assigneeRole?: string
  dependencies: string[]
  tags: string[]
}

interface ProjectTemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: ProjectTemplate) => void
  onCreateFromTemplate: (template: ProjectTemplate) => void
}

export default function ProjectTemplatesModal({
  isOpen,
  onClose,
  onSelectTemplate,
  onCreateFromTemplate
}: ProjectTemplatesModalProps) {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<ProjectTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedComplexity, setSelectedComplexity] = useState('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { showSuccess, showError } = useToast()

  // Templates pré-definidos
  const defaultTemplates: ProjectTemplate[] = [
    {
      id: 'template_1',
      name: 'Desenvolvimento de Sistema Web',
      description: 'Template completo para desenvolvimento de aplicações web com metodologia ágil',
      category: 'Desenvolvimento',
      methodology: 'AGILE',
      estimatedDuration: 90,
      teamSize: 5,
      complexity: 'HIGH',
      tags: ['Web', 'Frontend', 'Backend', 'Database'],
      tasks: [
        {
          id: 'task_1',
          title: 'Análise de Requisitos',
          description: 'Levantamento e documentação dos requisitos funcionais e não funcionais',
          status: 'TODO',
          priority: 'HIGH',
          estimatedHours: 40,
          assigneeRole: 'Analista',
          dependencies: [],
          tags: ['Análise', 'Documentação']
        },
        {
          id: 'task_2',
          title: 'Design da Arquitetura',
          description: 'Definição da arquitetura do sistema e tecnologias',
          status: 'TODO',
          priority: 'HIGH',
          estimatedHours: 32,
          assigneeRole: 'Arquiteto',
          dependencies: ['task_1'],
          tags: ['Arquitetura', 'Design']
        },
        {
          id: 'task_3',
          title: 'Desenvolvimento Frontend',
          description: 'Implementação da interface do usuário',
          status: 'TODO',
          priority: 'MEDIUM',
          estimatedHours: 120,
          assigneeRole: 'Frontend Developer',
          dependencies: ['task_2'],
          tags: ['Frontend', 'UI/UX']
        }
      ],
      isPublic: true,
      isFavorite: false,
      usageCount: 15,
      createdBy: 'system',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'template_2',
      name: 'Migração de Sistema Legacy',
      description: 'Template para migração de sistemas legados com mínimo impacto',
      category: 'Migração',
      methodology: 'WATERFALL',
      estimatedDuration: 120,
      teamSize: 8,
      complexity: 'HIGH',
      tags: ['Legacy', 'Migração', 'Database', 'Integração'],
      tasks: [
        {
          id: 'task_4',
          title: 'Análise do Sistema Atual',
          description: 'Mapeamento completo do sistema legacy',
          status: 'TODO',
          priority: 'HIGH',
          estimatedHours: 60,
          assigneeRole: 'Analista Senior',
          dependencies: [],
          tags: ['Análise', 'Legacy']
        }
      ],
      isPublic: true,
      isFavorite: true,
      usageCount: 8,
      createdBy: 'system',
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z'
    },
    {
      id: 'template_3',
      name: 'Implementação de API REST',
      description: 'Template para desenvolvimento de APIs RESTful robustas',
      category: 'API',
      methodology: 'AGILE',
      estimatedDuration: 45,
      teamSize: 3,
      complexity: 'MEDIUM',
      tags: ['API', 'REST', 'Backend', 'Documentação'],
      tasks: [
        {
          id: 'task_5',
          title: 'Design da API',
          description: 'Definição dos endpoints e contratos da API',
          status: 'TODO',
          priority: 'HIGH',
          estimatedHours: 24,
          assigneeRole: 'Backend Developer',
          dependencies: [],
          tags: ['API', 'Design']
        }
      ],
      isPublic: true,
      isFavorite: false,
      usageCount: 22,
      createdBy: 'system',
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z'
    }
  ]

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  useEffect(() => {
    filterTemplates()
  }, [templates, searchTerm, selectedCategory, selectedComplexity, showFavoritesOnly])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      // Em produção, carregar da API
      await new Promise(resolve => setTimeout(resolve, 500))
      setTemplates(defaultTemplates)
    } catch (error) {
      showError('Erro', 'Falha ao carregar templates')
    } finally {
      setLoading(false)
    }
  }

  const filterTemplates = () => {
    let filtered = [...templates]

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filtro por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory)
    }

    // Filtro por complexidade
    if (selectedComplexity !== 'all') {
      filtered = filtered.filter(template => template.complexity === selectedComplexity)
    }

    // Filtro por favoritos
    if (showFavoritesOnly) {
      filtered = filtered.filter(template => template.isFavorite)
    }

    setFilteredTemplates(filtered)
  }

  const toggleFavorite = async (templateId: string) => {
    try {
      const updatedTemplates = templates.map(template =>
        template.id === templateId
          ? { ...template, isFavorite: !template.isFavorite }
          : template
      )
      setTemplates(updatedTemplates)
      showSuccess('Favorito Atualizado', 'Template atualizado com sucesso')
    } catch (error) {
      showError('Erro', 'Falha ao atualizar favorito')
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'LOW': return 'text-green-400'
      case 'MEDIUM': return 'text-yellow-400'
      case 'HIGH': return 'text-red-400'
      default: return 'text-dark-400'
    }
  }

  const getComplexityLabel = (complexity: string) => {
    switch (complexity) {
      case 'LOW': return 'Baixa'
      case 'MEDIUM': return 'Média'
      case 'HIGH': return 'Alta'
      default: return complexity
    }
  }

  const categories = [...new Set(templates.map(t => t.category))]

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Templates de Projetos"
      size="xl"
    >
      <div className="p-6 space-y-6">
        {/* Filtros */}
        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          {/* Filtros em linha */}
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={selectedComplexity}
              onChange={(e) => setSelectedComplexity(e.target.value)}
              className="input-field"
            >
              <option value="all">Todas as Complexidades</option>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
            </select>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showFavoritesOnly}
                onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                className="rounded border-dark-600 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-dark-200">Apenas Favoritos</span>
            </label>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-dark-400 mt-2">Carregando templates...</p>
          </div>
        )}

        {/* Templates Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-dark-700 border border-dark-600 rounded-lg p-4 hover:border-primary-500/50 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-dark-50 mb-1">{template.name}</h3>
                    <p className="text-sm text-dark-400 line-clamp-2">{template.description}</p>
                  </div>
                  
                  <button
                    onClick={() => toggleFavorite(template.id)}
                    className={`p-1 rounded ${template.isFavorite ? 'text-yellow-400' : 'text-dark-500 hover:text-yellow-400'}`}
                  >
                    <Star className={`w-4 h-4 ${template.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
                  <div className="flex items-center space-x-1 text-dark-400">
                    <Calendar className="w-3 h-3" />
                    <span>{template.estimatedDuration} dias</span>
                  </div>
                  <div className="flex items-center space-x-1 text-dark-400">
                    <Users className="w-3 h-3" />
                    <span>{template.teamSize} pessoas</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-dark-500">Complexidade:</span>
                    <span className={getComplexityColor(template.complexity)}>
                      {getComplexityLabel(template.complexity)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-dark-400">
                    <Copy className="w-3 h-3" />
                    <span>{template.usageCount} usos</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-dark-600 text-dark-300 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="px-2 py-1 bg-dark-600 text-dark-400 text-xs rounded">
                      +{template.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => onSelectTemplate(template)}
                    className="btn-secondary btn-sm flex-1"
                  >
                    <FileTemplate className="w-4 h-4 mr-1" />
                    Visualizar
                  </button>
                  <button
                    onClick={() => onCreateFromTemplate(template)}
                    className="btn-primary btn-sm flex-1"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Usar Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredTemplates.length === 0 && (
          <div className="text-center py-8">
            <FileTemplate className="w-12 h-12 text-dark-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-dark-300 mb-2">Nenhum template encontrado</h3>
            <p className="text-dark-500">Tente ajustar os filtros ou criar um novo template</p>
          </div>
        )}
      </div>
    </ResponsiveModal>
  )
}

// Hook para gerenciar templates
export function useProjectTemplates() {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [loading, setLoading] = useState(false)

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/project-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const createFromTemplate = async (template: ProjectTemplate, projectData: any) => {
    try {
      const response = await fetch('/api/projects/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          projectData
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.project
      }
      throw new Error('Falha ao criar projeto')
    } catch (error) {
      console.error('Erro ao criar projeto do template:', error)
      throw error
    }
  }

  return {
    templates,
    loading,
    loadTemplates,
    createFromTemplate
  }
}