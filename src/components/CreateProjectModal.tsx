'use client'

import { useState } from 'react'
import { X, Calendar, Users, Target } from 'lucide-react'
import { useToast } from './ToastContainer'

interface ProjectFormData {
  title: string
  description: string
  methodology: 'AGILE' | 'WATERFALL' | 'KANBAN' | 'SCRUM' | 'DESIGN_THINKING' | 'PMI'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  startDate: string
  endDate: string
  team: string
  budget?: number
}

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onProjectCreated: (project: any) => void
}

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    methodology: 'AGILE',
    priority: 'MEDIUM',
    startDate: '',
    endDate: '',
    team: '',
    budget: undefined
  })
  const [errors, setErrors] = useState<Partial<ProjectFormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<ProjectFormData> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Data de início é obrigatória'
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Data de término é obrigatória'
    }

    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = 'Data de término deve ser posterior à data de início'
    }

    if (!formData.team.trim()) {
      newErrors.team = 'Equipe é obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showError('Erro de Validação', 'Por favor, corrija os campos destacados')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const project = await response.json()
        showSuccess('Projeto Criado', 'Projeto criado com sucesso!')
        onProjectCreated(project)
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          methodology: 'AGILE',
          priority: 'MEDIUM',
          startDate: '',
          endDate: '',
          team: '',
          budget: undefined
        })
        setErrors({})
        onClose()
      } else {
        const error = await response.json()
        showError('Erro', error.message || 'Erro ao criar projeto')
      }
    } catch (error) {
      console.error('Erro ao criar projeto:', error)
      showError('Erro', 'Erro interno do servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setErrors({})
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-xl font-semibold text-dark-50">Novo Projeto</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-dark-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Título do Projeto *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={`input-field w-full ${errors.title ? 'border-accent-red' : ''}`}
                placeholder="Digite o título do projeto"
                disabled={loading}
              />
              {errors.title && (
                <p className="text-accent-red text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Descrição *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={`input-field w-full h-24 resize-none ${errors.description ? 'border-accent-red' : ''}`}
                placeholder="Descreva os objetivos e escopo do projeto"
                disabled={loading}
              />
              {errors.description && (
                <p className="text-accent-red text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Metodologia e Prioridade */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Metodologia
                </label>
                <select
                  value={formData.methodology}
                  onChange={(e) => setFormData(prev => ({ ...prev, methodology: e.target.value as any }))}
                  className="input-field w-full"
                  disabled={loading}
                >
                  <option value="AGILE">Ágil</option>
                  <option value="WATERFALL">Cascata</option>
                  <option value="KANBAN">Kanban</option>
                  <option value="SCRUM">Scrum</option>
                  <option value="DESIGN_THINKING">Design Thinking</option>
                  <option value="PMI">PMI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Prioridade
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="input-field w-full"
                  disabled={loading}
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data de Início *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className={`input-field w-full ${errors.startDate ? 'border-accent-red' : ''}`}
                  disabled={loading}
                />
                {errors.startDate && (
                  <p className="text-accent-red text-sm mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data de Término *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className={`input-field w-full ${errors.endDate ? 'border-accent-red' : ''}`}
                  disabled={loading}
                />
                {errors.endDate && (
                  <p className="text-accent-red text-sm mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Equipe */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Equipe Responsável *
              </label>
              <input
                type="text"
                value={formData.team}
                onChange={(e) => setFormData(prev => ({ ...prev, team: e.target.value }))}
                className={`input-field w-full ${errors.team ? 'border-accent-red' : ''}`}
                placeholder="Nome da equipe ou responsáveis"
                disabled={loading}
              />
              {errors.team && (
                <p className="text-accent-red text-sm mt-1">{errors.team}</p>
              )}
            </div>

            {/* Orçamento */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                <Target className="w-4 h-4 inline mr-1" />
                Orçamento (R$)
              </label>
              <input
                type="number"
                value={formData.budget || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value ? parseFloat(e.target.value) : undefined }))}
                className="input-field w-full"
                placeholder="0,00"
                min="0"
                step="0.01"
                disabled={loading}
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </div>
                ) : (
                  'Criar Projeto'
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}