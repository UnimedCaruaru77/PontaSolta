'use client'

import { useState } from 'react'
import { X, FolderKanban, Calendar, Users, Target } from 'lucide-react'
import { useToast } from './ToastContainer'
import { ButtonSpinner } from './LoadingSpinner'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (project: any) => void
}

interface ProjectFormData {
  title: string
  description: string
  methodology: 'AGILE' | 'LEAN_STARTUP' | 'DESIGN_THINKING' | 'PMI'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  startDate: string
  endDate: string
  team: string
  budget?: number
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
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

  if (!isOpen) return null



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateAll()) {
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
        body: JSON.stringify({
          ...formData,
          status: 'PLANNING',
          progress: 0,
          createdAt: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao criar projeto')
      }

      const data = await response.json()
      
      showSuccess('Projeto Criado!', `O projeto "${formData.title}" foi criado com sucesso`)
      
      if (onSuccess) {
        onSuccess(data.project)
      }
      
      // Reset form
      reset()
      onClose()

    } catch (error) {
      console.error('Erro ao criar projeto:', error)
      showError('Erro ao Criar Projeto', 'Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      reset()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary-500/10 rounded-lg">
              <FolderKanban className="w-5 h-5 text-secondary-500" />
            </div>
            <h2 className="text-xl font-semibold text-dark-50">Novo Projeto</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-dark-200 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Título */}
          <FormField
            label="Título do Projeto"
            required
            error={errors.title}
            hasError={!!errors.title}
          >
            <InputField
              {...getFieldProps('title')}
              placeholder="Digite o título do projeto"
              disabled={loading}
            />
          </FormField>

          {/* Descrição */}
          <FormField
            label="Descrição"
            required
            error={errors.description}
            hasError={!!errors.description}
            hint="Descreva os objetivos e escopo do projeto (mínimo 10 caracteres)"
          >
            <TextAreaField
              {...getFieldProps('description')}
              placeholder="Descreva os objetivos e escopo do projeto"
              disabled={loading}
              rows={3}
            />
          </FormField>

          {/* Metodologia e Prioridade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Metodologia
              </label>
              <SelectField
                value={formData.methodology}
                onChange={(e) => getFieldProps('methodology').onChange(e)}
                disabled={loading}
              >
                <option value="AGILE">Ágil</option>
                <option value="LEAN_STARTUP">Lean Startup</option>
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
              </select>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
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

          {/* Equipe e Orçamento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Equipe Responsável *
              </label>
              <input
                type="text"
                value={formData.team}
                onChange={(e) => setFormData(prev => ({ ...prev, team: e.target.value }))}
                className={`input-field w-full ${errors.team ? 'border-accent-red' : ''}`}
                placeholder="Nome da equipe"
                disabled={loading}
              />
              {errors.team && (
                <p className="text-accent-red text-sm mt-1">{errors.team}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Orçamento (opcional)
              </label>
              <input
                type="number"
                value={formData.budget || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value ? Number(e.target.value) : undefined }))}
                className="input-field w-full"
                placeholder="R$ 0,00"
                min="0"
                step="0.01"
                disabled={loading}
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-dark-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="btn-secondary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && <ButtonSpinner />}
              <span>{loading ? 'Criando...' : 'Criar Projeto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}