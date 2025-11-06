'use client'

import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'

interface Card {
  id: string
  title: string
  description?: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  urgency: 'URGENT' | 'NOT_URGENT'
  highImpact: boolean
  isProject: boolean
  assignee?: {
    id: string
    name: string
    email: string
  }
  creator: {
    id: string
    name: string
    email: string
  }
  startDate?: string
  endDate?: string
  lecomTicket?: string
  position: number
  columnId: string
}

interface SimpleCardModalProps {
  card: Card
  isOpen: boolean
  onClose: () => void
  onSave: (card: Card) => Promise<void>
}

export default function SimpleCardModal({ card, isOpen, onClose, onSave }: SimpleCardModalProps) {
  const [formData, setFormData] = useState<Card>(card)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && card) {
      setFormData(card)
    }
  }, [isOpen, card.id])

  if (!isOpen) return null

  const handleSave = async () => {
    if (loading) return
    
    setLoading(true)
    
    try {
      if (!formData.title?.trim()) {
        alert('Título é obrigatório')
        return
      }

      const isNewCard = card.id.startsWith('temp_')
      
      const cardToSave = {
        ...formData,
        id: isNewCard ? `card_${Date.now()}` : formData.id,
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        priority: formData.priority || 'MEDIUM',
        urgency: formData.urgency || 'NOT_URGENT',
        highImpact: formData.highImpact || false,
        isProject: formData.isProject || false,
        columnId: formData.columnId || card.columnId,
        position: formData.position || 0,
        creator: formData.creator || card.creator
      }

      await onSave(cardToSave)
      onClose()
      
    } catch (error) {
      console.error('Erro ao salvar card:', error)
      alert('Erro ao salvar card. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-xl font-semibold text-dark-50">
            {card.id.startsWith('temp_') ? 'Nova Demanda' : 'Editar Card'}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-dark-200 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Digite o título da demanda..."
              disabled={loading}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Descreva a demanda..."
              disabled={loading}
            />
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Prioridade
            </label>
            <select
              value={formData.priority || 'MEDIUM'}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'HIGH' | 'MEDIUM' | 'LOW' }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
            </select>
          </div>

          {/* Urgência */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Urgência
            </label>
            <select
              value={formData.urgency || 'NOT_URGENT'}
              onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as 'URGENT' | 'NOT_URGENT' }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="NOT_URGENT">Não Urgente</option>
              <option value="URGENT">Urgente</option>
            </select>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.highImpact || false}
                onChange={(e) => setFormData(prev => ({ ...prev, highImpact: e.target.checked }))}
                className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
                disabled={loading}
              />
              <span className="text-dark-300">Alto Impacto</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.isProject || false}
                onChange={(e) => setFormData(prev => ({ ...prev, isProject: e.target.checked }))}
                className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
                disabled={loading}
              />
              <span className="text-dark-300">É Projeto</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-dark-700">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-dark-300 hover:text-dark-100 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !formData.title?.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}