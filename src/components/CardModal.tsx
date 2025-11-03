'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Calendar, 
  User, 
  Flag, 
  Clock, 
  FolderKanban, 
  ExternalLink,
  Plus,
  Check,
  Trash2,
  Save
} from 'lucide-react'
import { ButtonSpinner } from './LoadingSpinner'

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

interface ChecklistItem {
  id: string
  title: string
  completed: boolean
  position: number
}

interface CardModalProps {
  card: Card
  isOpen: boolean
  onClose: () => void
  onSave: (card: Card) => void
}

export default function CardModal({ card, isOpen, onClose, onSave }: CardModalProps) {
  const [formData, setFormData] = useState<Card>(card)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [showLecomForm, setShowLecomForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lecomData, setLecomData] = useState({
    categoria: '',
    filial: '',
    departamento: '',
    telefone: '',
    email: ''
  })

  useEffect(() => {
    setFormData(card)
    
    // Carregar checklist do card
    const fetchChecklist = async () => {
      try {
        const response = await fetch(`/api/cards/${card.id}/checklist`)
        if (response.ok) {
          const data = await response.json()
          setChecklist(data.checklist || [])
        }
      } catch (error) {
        console.error('Erro ao carregar checklist:', error)
      }
    }

    if (card.id) {
      fetchChecklist()
    }
  }, [card])

  if (!isOpen) return null

  const handleSave = async () => {
    setLoading(true)
    
    try {
      // Validação básica antes de enviar
      if (!formData.title?.trim()) {
        alert('Título é obrigatório')
        return
      }
      console.log('Salvando card com dados:', {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        urgency: formData.urgency,
        highImpact: formData.highImpact,
        isProject: formData.isProject,
        startDate: formData.startDate,
        endDate: formData.endDate,
        assigneeId: formData.assignee?.id,
        lecomTicket: formData.lecomTicket
      })

      const response = await fetch(`/api/cards/${card.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          urgency: formData.urgency,
          highImpact: formData.highImpact,
          isProject: formData.isProject,
          startDate: formData.startDate,
          endDate: formData.endDate,
          assigneeId: formData.assignee?.id,
          lecomTicket: formData.lecomTicket
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar card')
      }

      const data = await response.json()
      
      console.log('✅ Resposta da API ao salvar card:', data)
      
      if (data.success && data.card) {
        console.log('✅ Card atualizado com sucesso:', data.card)
        
        // Garantir que o card retornado tenha a estrutura correta para o frontend
        const updatedCard = {
          ...card, // Manter estrutura original
          ...data.card, // Sobrescrever com dados atualizados
          // Garantir campos essenciais
          id: data.card.id || card.id,
          columnId: data.card.columnId || card.columnId,
          position: data.card.position || card.position,
          // Converter campos do backend se necessário
          highImpact: data.card.highImpact ?? data.card.high_impact ?? card.highImpact,
          isProject: data.card.isProject ?? data.card.is_project ?? card.isProject,
          startDate: data.card.startDate ?? data.card.start_date ?? card.startDate,
          endDate: data.card.endDate ?? data.card.end_date ?? card.endDate,
          lecomTicket: data.card.lecomTicket ?? data.card.lecom_ticket ?? card.lecomTicket,
          assignee: data.card.assignee || formData.assignee || card.assignee,
          creator: data.card.creator || card.creator
        }
        
        console.log('📝 Card formatado para retorno:', updatedCard)
        
        alert('Card atualizado com sucesso!')
        
        if (onSave) {
          onSave(updatedCard)
        }
        
        onClose()
      } else {
        throw new Error(data.error || 'Resposta inválida da API')
      }

    } catch (error) {
      console.error('Erro ao salvar card:', error)
      alert('Erro ao salvar: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  const handleChecklistToggle = async (itemId: string) => {
    const item = checklist.find(i => i.id === itemId)
    if (!item) return

    try {
      const response = await fetch(`/api/checklist/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !item.completed })
      })

      if (response.ok) {
        setChecklist(prev => prev.map(i =>
          i.id === itemId ? { ...i, completed: !i.completed } : i
        ))
      }
    } catch (error) {
      console.error('Erro ao atualizar checklist:', error)
    }
  }

  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim()) return

    try {
      const response = await fetch(`/api/cards/${card.id}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newChecklistItem.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        setChecklist(prev => [...prev, data.item])
        setNewChecklistItem('')
      }
    } catch (error) {
      console.error('Erro ao adicionar item ao checklist:', error)
    }
  }

  const handleDeleteChecklistItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/checklist/${itemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setChecklist(prev => prev.filter(item => item.id !== itemId))
      }
    } catch (error) {
      console.error('Erro ao deletar item do checklist:', error)
    }
  }

  const handleOpenLecomTicket = () => {
    // Implementar integração com LECOM
    console.log('Abrir chamado LECOM:', lecomData)
    setShowLecomForm(false)
  }

  const handleAssigneeChange = (assigneeId: string) => {
    console.log('Alterar responsável para:', assigneeId)
    
    // Mapear IDs para dados dos usuários (mock data)
    const users = {
      '1': { id: '1', name: 'Luciano Filho', email: 'luciano.filho@unimed.com' },
      '2': { id: '2', name: 'Edwa Favre', email: 'edwa.favre@hospital.com' },
      '3': { id: '3', name: 'Marcos Barreto', email: 'marcos.barreto@unimed.com' }
    }
    
    setFormData(prev => ({
      ...prev,
      assignee: assigneeId ? users[assigneeId as keyof typeof users] : undefined
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="text-xl font-semibold bg-transparent border-none outline-none text-dark-50 flex-1"
            />
            {formData.isProject && (
              <FolderKanban className="w-5 h-5 text-secondary-500" />
            )}
            {formData.lecomTicket && (
              <div className="flex items-center space-x-1 text-primary-500">
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">{formData.lecomTicket}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-dark-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input-field w-full h-24 resize-none"
                placeholder="Descreva os detalhes da demanda..."
              />
            </div>

            {/* Checklist */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-dark-200">
                  Checklist ({checklist.filter(item => item.completed).length}/{checklist.length})
                </label>
              </div>
              
              <div className="space-y-2 mb-3">
                {checklist.map(item => (
                  <div key={item.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-dark-700">
                    <button
                      onClick={() => handleChecklistToggle(item.id)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        item.completed
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-dark-500 hover:border-primary-500'
                      }`}
                    >
                      {item.completed && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <span className={`flex-1 text-sm ${
                      item.completed ? 'text-dark-400 line-through' : 'text-dark-200'
                    }`}>
                      {item.title}
                    </span>
                    <button 
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      className="p-1 hover:bg-dark-600 rounded text-dark-500 hover:text-accent-red"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                  className="input-field flex-1 text-sm"
                  placeholder="Adicionar item ao checklist..."
                />
                <button
                  onClick={handleAddChecklistItem}
                  className="btn-primary px-3 py-2"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* LECOM Integration */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-dark-200">
                  Integração LECOM
                </label>
                {!formData.lecomTicket && (
                  <button
                    onClick={() => setShowLecomForm(true)}
                    className="btn-secondary text-xs px-3 py-1"
                  >
                    Abrir Chamado
                  </button>
                )}
              </div>

              {showLecomForm && (
                <div className="bg-dark-700 border border-dark-600 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-dark-300 mb-1">Categoria</label>
                      <select
                        value={lecomData.categoria}
                        onChange={(e) => setLecomData(prev => ({ ...prev, categoria: e.target.value }))}
                        className="input-field w-full text-sm"
                      >
                        <option value="">Selecionar categoria</option>
                        <option value="hardware">Hardware</option>
                        <option value="software">Software</option>
                        <option value="rede">Rede</option>
                        <option value="email">Email</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-dark-300 mb-1">Filial</label>
                      <input
                        type="text"
                        value={lecomData.filial}
                        onChange={(e) => setLecomData(prev => ({ ...prev, filial: e.target.value }))}
                        className="input-field w-full text-sm"
                        placeholder="Matriz"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleOpenLecomTicket}
                      className="btn-primary text-sm"
                    >
                      Confirmar Abertura
                    </button>
                    <button
                      onClick={() => setShowLecomForm(false)}
                      className="btn-secondary text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {formData.lecomTicket && (
                <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4 text-primary-500" />
                    <span className="text-sm text-primary-400">
                      Chamado LECOM: {formData.lecomTicket}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l border-dark-700 p-6 overflow-y-auto">
            {/* Priority & Urgency */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark-200 mb-3">
                Prioridade & Urgência
              </label>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Prioridade</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      priority: e.target.value as 'HIGH' | 'MEDIUM' | 'LOW' 
                    }))}
                    className="input-field w-full"
                  >
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-dark-400 mb-1">Urgência</label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      urgency: e.target.value as 'URGENT' | 'NOT_URGENT' 
                    }))}
                    className="input-field w-full"
                  >
                    <option value="NOT_URGENT">Não Urgente</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="highImpact"
                    checked={formData.highImpact}
                    onChange={(e) => setFormData(prev => ({ ...prev, highImpact: e.target.checked }))}
                    className="w-4 h-4 text-accent-yellow bg-dark-700 border-dark-600 rounded focus:ring-accent-yellow"
                  />
                  <label htmlFor="highImpact" className="text-sm text-dark-200">
                    Alto Impacto
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isProject"
                    checked={formData.isProject}
                    onChange={(e) => setFormData(prev => ({ ...prev, isProject: e.target.checked }))}
                    className="w-4 h-4 text-secondary-500 bg-dark-700 border-dark-600 rounded focus:ring-secondary-500"
                  />
                  <label htmlFor="isProject" className="text-sm text-dark-200">
                    É um Projeto
                  </label>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark-200 mb-3">
                Prazos
              </label>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Data de Início</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs text-dark-400 mb-1">Data de Término</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
              </div>
            </div>

            {/* Assignment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark-200 mb-3">
                Atribuição
              </label>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Criado por</label>
                  <div className="flex items-center space-x-2 p-2 bg-dark-700 rounded-lg">
                    <User className="w-4 h-4 text-dark-400" />
                    <span className="text-sm text-dark-200">{formData.creator.name}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-dark-400 mb-1">Responsável</label>
                  <select 
                    value={formData.assignee?.id || ''}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">Selecionar responsável</option>
                    <option value="1">Luciano Filho</option>
                    <option value="2">Edwa Favre</option>
                    <option value="3">Marcos Barreto</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn-primary w-full justify-center disabled:opacity-50 flex items-center space-x-2"
              >
                {loading && <ButtonSpinner />}
                <Save className="w-4 h-4" />
                <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
              
              <button
                onClick={onClose}
                disabled={loading}
                className="btn-secondary w-full justify-center disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>

            {/* Funcionalidades avançadas serão implementadas em breve */}
            <div className="border-t border-dark-700 pt-6">
              <p className="text-dark-400 text-center py-4">
                💬 Comentários e 📎 Anexos serão implementados em breve
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}