'use client'

import { useState } from 'react'
import { X, Filter, Calendar, Users, Flag, Search } from 'lucide-react'
import { useToast } from './ToastContainer'
import { ButtonSpinner } from './LoadingSpinner'

interface FilterOptions {
  dateRange: {
    startDate: string
    endDate: string
    preset: 'custom' | 'today' | 'week' | 'month' | 'quarter' | 'year'
  }
  status: string[]
  priority: string[]
  urgency: string[]
  teams: string[]
  assignees: string[]
  creators: string[]
  tags: string[]
  hasDeadline: boolean | null
  isOverdue: boolean | null
  isProject: boolean | null
}

interface AdvancedFiltersModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: FilterOptions) => void
  currentFilters?: Partial<FilterOptions>
  context: 'dashboard' | 'kanban' | 'projects' | 'teams' | 'reports' | 'my-space'
}

export default function AdvancedFiltersModal({ 
  isOpen, 
  onClose, 
  onApplyFilters, 
  currentFilters = {},
  context 
}: AdvancedFiltersModalProps) {
  const { showSuccess } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      startDate: '',
      endDate: '',
      preset: 'month'
    },
    status: [],
    priority: [],
    urgency: [],
    teams: [],
    assignees: [],
    creators: [],
    tags: [],
    hasDeadline: null,
    isOverdue: null,
    isProject: null,
    ...currentFilters
  })

  // Opções baseadas no contexto
  const getContextOptions = () => {
    const baseOptions = {
      status: [
        { value: 'BACKLOG', label: 'Backlog' },
        { value: 'IN_PROGRESS', label: 'Em Andamento' },
        { value: 'REVIEW', label: 'Em Revisão' },
        { value: 'DONE', label: 'Concluído' }
      ],
      priority: [
        { value: 'HIGH', label: 'Alta' },
        { value: 'MEDIUM', label: 'Média' },
        { value: 'LOW', label: 'Baixa' }
      ],
      urgency: [
        { value: 'URGENT', label: 'Urgente' },
        { value: 'NOT_URGENT', label: 'Não Urgente' }
      ],
      teams: [
        { value: 'service-desk', label: 'Service Desk Operadora' },
        { value: 'nti', label: 'NTI Lideranças' },
        { value: 'dev', label: 'Desenvolvimento' }
      ],
      assignees: [
        { value: 'user_1', label: 'Luciano Filho' },
        { value: 'user_2', label: 'Edwa Favre' },
        { value: 'user_3', label: 'Marcos Barreto' }
      ]
    }

    if (context === 'projects') {
      return {
        ...baseOptions,
        status: [
          { value: 'PLANNING', label: 'Planejamento' },
          { value: 'IN_PROGRESS', label: 'Em Andamento' },
          { value: 'REVIEW', label: 'Em Revisão' },
          { value: 'COMPLETED', label: 'Concluído' }
        ]
      }
    }

    return baseOptions
  }

  const options = getContextOptions()

  if (!isOpen) return null

  const handlePresetChange = (preset: string) => {
    const now = new Date()
    let startDate = ''
    let endDate = ''

    switch (preset) {
      case 'today':
        startDate = now.toISOString().split('T')[0]
        endDate = startDate
        break
      case 'week':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
        const weekEnd = new Date(now.setDate(weekStart.getDate() + 6))
        startDate = weekStart.toISOString().split('T')[0]
        endDate = weekEnd.toISOString().split('T')[0]
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        break
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0]
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0).toISOString().split('T')[0]
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
        endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
        break
    }

    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        preset: preset as any,
        startDate,
        endDate
      }
    }))
  }

  const handleMultiSelect = (field: keyof FilterOptions, value: string) => {
    setFilters(prev => {
      const currentValues = prev[field] as string[]
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value]
      
      return {
        ...prev,
        [field]: newValues
      }
    })
  }

  const handleApply = async () => {
    setLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500)) // Simular processamento
      onApplyFilters(filters)
      showSuccess('Filtros Aplicados', 'Os filtros foram aplicados com sucesso')
      onClose()
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setFilters({
      dateRange: {
        startDate: '',
        endDate: '',
        preset: 'month'
      },
      status: [],
      priority: [],
      urgency: [],
      teams: [],
      assignees: [],
      creators: [],
      tags: [],
      hasDeadline: null,
      isOverdue: null,
      isProject: null
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.status.length > 0) count++
    if (filters.priority.length > 0) count++
    if (filters.urgency.length > 0) count++
    if (filters.teams.length > 0) count++
    if (filters.assignees.length > 0) count++
    if (filters.hasDeadline !== null) count++
    if (filters.isOverdue !== null) count++
    if (filters.isProject !== null) count++
    return count
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-500/10 rounded-lg">
              <Filter className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-dark-50">Filtros Avançados</h2>
              <p className="text-sm text-dark-400">
                {getActiveFiltersCount()} filtro(s) ativo(s)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-dark-200 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-180px)] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Período */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-dark-50 flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Período</span>
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-dark-300 mb-2">Período Pré-definido</label>
                  <select
                    value={filters.dateRange.preset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="today">Hoje</option>
                    <option value="week">Esta Semana</option>
                    <option value="month">Este Mês</option>
                    <option value="quarter">Este Trimestre</option>
                    <option value="year">Este Ano</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>

                {filters.dateRange.preset === 'custom' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-dark-300 mb-1">Data Inicial</label>
                      <input
                        type="date"
                        value={filters.dateRange.startDate}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, startDate: e.target.value }
                        }))}
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-dark-300 mb-1">Data Final</label>
                      <input
                        type="date"
                        value={filters.dateRange.endDate}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, endDate: e.target.value }
                        }))}
                        className="input-field w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-dark-50">Status</h3>
              <div className="space-y-2">
                {options.status.map(option => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(option.value)}
                      onChange={() => handleMultiSelect('status', option.value)}
                      className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-dark-200">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Prioridade */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-dark-50 flex items-center space-x-2">
                <Flag className="w-4 h-4" />
                <span>Prioridade</span>
              </h3>
              <div className="space-y-2">
                {options.priority.map(option => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.priority.includes(option.value)}
                      onChange={() => handleMultiSelect('priority', option.value)}
                      className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-dark-200">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Urgência */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-dark-50">Urgência</h3>
              <div className="space-y-2">
                {options.urgency.map(option => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.urgency.includes(option.value)}
                      onChange={() => handleMultiSelect('urgency', option.value)}
                      className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-dark-200">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Equipes */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-dark-50 flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Equipes</span>
              </h3>
              <div className="space-y-2">
                {options.teams.map(option => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.teams.includes(option.value)}
                      onChange={() => handleMultiSelect('teams', option.value)}
                      className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-dark-200">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Responsáveis */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-dark-50">Responsáveis</h3>
              <div className="space-y-2">
                {options.assignees.map(option => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.assignees.includes(option.value)}
                      onChange={() => handleMultiSelect('assignees', option.value)}
                      className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-dark-200">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtros Especiais */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-medium text-dark-50">Filtros Especiais</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-sm text-dark-300 mb-2">Possui Prazo</label>
                  <select
                    value={filters.hasDeadline === null ? '' : filters.hasDeadline.toString()}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      hasDeadline: e.target.value === '' ? null : e.target.value === 'true'
                    }))}
                    className="input-field w-full"
                  >
                    <option value="">Todos</option>
                    <option value="true">Com Prazo</option>
                    <option value="false">Sem Prazo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-dark-300 mb-2">Status do Prazo</label>
                  <select
                    value={filters.isOverdue === null ? '' : filters.isOverdue.toString()}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      isOverdue: e.target.value === '' ? null : e.target.value === 'true'
                    }))}
                    className="input-field w-full"
                  >
                    <option value="">Todos</option>
                    <option value="true">Vencidos</option>
                    <option value="false">No Prazo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-dark-300 mb-2">Tipo</label>
                  <select
                    value={filters.isProject === null ? '' : filters.isProject.toString()}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      isProject: e.target.value === '' ? null : e.target.value === 'true'
                    }))}
                    className="input-field w-full"
                  >
                    <option value="">Todos</option>
                    <option value="true">Projetos</option>
                    <option value="false">Tarefas</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-dark-700">
          <button
            onClick={handleClear}
            disabled={loading}
            className="btn-secondary disabled:opacity-50"
          >
            Limpar Filtros
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="btn-secondary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              disabled={loading}
              className="btn-primary disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && <ButtonSpinner />}
              <span>{loading ? 'Aplicando...' : 'Aplicar Filtros'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}