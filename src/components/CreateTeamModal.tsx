'use client'

import { useState } from 'react'
import { X, Users, Building, UserPlus } from 'lucide-react'
import { useToast } from './ToastContainer'
import { ButtonSpinner } from './LoadingSpinner'

interface CreateTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (team: any) => void
}

interface TeamFormData {
  name: string
  description: string
  parentTeamId?: string
}

export default function CreateTeamModal({ isOpen, onClose, onSuccess }: CreateTeamModalProps) {
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    description: '',
    parentTeamId: undefined
  })

  const [errors, setErrors] = useState<Partial<TeamFormData>>({})

  // Mock de equipes existentes para seleção de equipe pai
  const existingTeams = [
    { id: '1', name: 'NTI Lideranças' },
    { id: '2', name: 'Service Desk Operadora' },
    { id: '3', name: 'Desenvolvimento' }
  ]

  if (!isOpen) return null

  const validateForm = (): boolean => {
    const newErrors: Partial<TeamFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome da equipe é obrigatório'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória'
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
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isActive: true,
          createdAt: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao criar equipe')
      }

      const data = await response.json()
      
      showSuccess('Equipe Criada!', `A equipe "${formData.name}" foi criada com sucesso`)
      
      if (onSuccess) {
        onSuccess(data.team)
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        parentTeamId: undefined
      })
      setErrors({})
      onClose()

    } catch (error) {
      console.error('Erro ao criar equipe:', error)
      showError('Erro ao Criar Equipe', 'Ocorreu um erro inesperado. Tente novamente.')
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-500/10 rounded-lg">
              <Users className="w-5 h-5 text-primary-500" />
            </div>
            <h2 className="text-xl font-semibold text-dark-50">Nova Equipe</h2>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nome da Equipe */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Nome da Equipe *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`input-field w-full ${errors.name ? 'border-accent-red' : ''}`}
              placeholder="Digite o nome da equipe"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-accent-red text-sm mt-1">{errors.name}</p>
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
              placeholder="Descreva o propósito e responsabilidades da equipe"
              disabled={loading}
            />
            {errors.description && (
              <p className="text-accent-red text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Equipe Pai (opcional) */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Equipe Pai (opcional)
            </label>
            <select
              value={formData.parentTeamId || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, parentTeamId: e.target.value || undefined }))}
              className="input-field w-full"
              disabled={loading}
            >
              <option value="">Nenhuma (equipe principal)</option>
              {existingTeams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <p className="text-dark-500 text-xs mt-1">
              Selecione uma equipe pai se esta for uma sub-equipe
            </p>
          </div>

          {/* Informação sobre membros */}
          <div className="bg-dark-700 border border-dark-600 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <UserPlus className="w-4 h-4 text-primary-500" />
              <h4 className="text-sm font-medium text-dark-200">Adição de Membros</h4>
            </div>
            <p className="text-dark-400 text-sm">
              Após criar a equipe, você poderá adicionar membros através da página de gerenciamento de equipes.
            </p>
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
              <span>{loading ? 'Criando...' : 'Criar Equipe'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}