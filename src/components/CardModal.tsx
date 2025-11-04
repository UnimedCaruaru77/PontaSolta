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
  Save,
  Edit3,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Users,
  MessageSquare,
  Paperclip,
  Settings,
  Activity,
  Eye,
  Copy
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

      // Verificar se é criação de novo card
      const isNewCard = card.id.startsWith('temp_')
      
      if (isNewCard) {
        // Criar novo card
        const response = await fetch('/api/cards', {
          method: 'POST',
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
            lecomTicket: formData.lecomTicket,
            columnId: formData.columnId,
            creatorId: formData.creator.id,
            boardId: '1', // ID do board padrão
            position: 0
          })
        })

        if (!response.ok) {
          throw new Error('Erro ao criar card')
        }

        const data = await response.json()
        
        console.log('✅ Card criado com sucesso:', data.card)
        alert('Card criado com sucesso!')
        
        if (onSave) {
          onSave(data.card)
        }
        
        onClose()
        return
      }
      const saveData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        urgency: formData.urgency,
        highImpact: formData.highImpact,
        isProject: formData.isProject,
        startDate: formData.startDate,
        endDate: formData.endDate,
        assigneeId: formData.assignee?.id || null,
        lecomTicket: formData.lecomTicket
      }
      
      console.log('Salvando card com dados:', saveData)

      const response = await fetch(`/api/cards/${card.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData)
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
    
    try {
      // Mapear IDs para dados dos usuários (mock data)
      const users = {
        '1': { id: '1', name: 'Luciano Filho', email: 'luciano.filho@unimed.com' },
        '2': { id: '2', name: 'Edwa Favre', email: 'edwa.favre@hospital.com' },
        '3': { id: '3', name: 'Marcos Barreto', email: 'marcos.barreto@unimed.com' }
      }
      
      setFormData(prev => ({
        ...prev,
        assignee: assigneeId && users[assigneeId as keyof typeof users] 
          ? users[assigneeId as keyof typeof users] 
          : undefined
      }))
    } catch (error) {
      console.error('Erro ao alterar responsável:', error)
    }
  }

  const getPriorityColor = () => {
    switch (formData.priority) {
      case 'HIGH': return 'text-accent-red border-accent-red/20 bg-accent-red/5'
      case 'MEDIUM': return 'text-accent-orange border-accent-orange/20 bg-accent-orange/5'
      case 'LOW': return 'text-green-500 border-green-500/20 bg-green-500/5'
      default: return 'text-dark-400 border-dark-600 bg-dark-700'
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900/95 backdrop-blur-xl border border-dark-700/50 rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header com gradiente */}
        <div className="relative bg-gradient-to-r from-dark-800 via-dark-800 to-dark-700 border-b border-dark-700/50">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4 flex-1">
              {/* Título editável */}
              <div className="flex-1">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="text-2xl font-bold bg-transparent border-none outline-none text-dark-50 w-full placeholder-dark-500 focus:text-primary-400 transition-colors"
                  placeholder="Título do card..."
                />
                <div className="flex items-center space-x-3 mt-2">
                  {/* Badges de status */}
                  {formData.isProject && (
                    <div className="flex items-center space-x-1 bg-secondary-500/10 text-secondary-400 px-3 py-1 rounded-full text-sm font-medium border border-secondary-500/20">
                      <FolderKanban className="w-4 h-4" />
                      <span>Projeto</span>
                    </div>
                  )}
                  {formData.lecomTicket && (
                    <div className="flex items-center space-x-1 bg-primary-500/10 text-primary-400 px-3 py-1 rounded-full text-sm font-medium border border-primary-500/20">
                      <ExternalLink className="w-4 h-4" />
                      <span>{formData.lecomTicket}</span>
                    </div>
                  )}
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor()}`}>
                    <Flag className="w-4 h-4" />
                    <span>
                      {formData.priority === 'HIGH' ? 'Alta Prioridade' : 
                       formData.priority === 'MEDIUM' ? 'Média Prioridade' : 'Baixa Prioridade'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Actions do header */}
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-primary-400 transition-all duration-200">
                  <Copy className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-primary-400 transition-all duration-200">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-primary-400 transition-all duration-200">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-dark-200 transition-all duration-200 ml-4"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Linha de progresso decorativa */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 opacity-30"></div>
        </div>

        <div className="flex h-[calc(95vh-140px)]">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto bg-dark-900/50">
            {/* Description */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-3">
                <Edit3 className="w-4 h-4 text-primary-400" />
                <label className="text-sm font-semibold text-dark-200">
                  Descrição
                </label>
              </div>
              <div className="relative">
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full h-32 bg-dark-800/50 border border-dark-600/50 rounded-xl p-4 text-dark-200 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200 resize-none"
                  placeholder="Descreva os detalhes da demanda, objetivos e requisitos..."
                />
                <div className="absolute bottom-3 right-3 text-xs text-dark-500">
                  {(formData.description || '').length} caracteres
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-primary-400" />
                  <label className="text-sm font-semibold text-dark-200">
                    Checklist
                  </label>
                  <span className="bg-dark-700/50 text-dark-300 text-xs px-2 py-1 rounded-full font-medium">
                    {checklist.filter(item => item.completed).length}/{checklist.length}
                  </span>
                </div>
                {checklist.length > 0 && (
                  <div className="text-xs text-dark-400">
                    {Math.round((checklist.filter(item => item.completed).length / checklist.length) * 100)}% concluído
                  </div>
                )}
              </div>
              
              {/* Progress bar */}
              {checklist.length > 0 && (
                <div className="w-full bg-dark-700/50 rounded-full h-2 mb-4">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(checklist.filter(item => item.completed).length / checklist.length) * 100}%` }}
                  ></div>
                </div>
              )}
              
              <div className="space-y-2 mb-4">
                {checklist.map(item => (
                  <div key={item.id} className="group flex items-center space-x-3 p-3 bg-dark-800/30 rounded-lg hover:bg-dark-700/50 transition-all duration-200">
                    <button
                      onClick={() => handleChecklistToggle(item.id)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                        item.completed
                          ? 'bg-primary-500 border-primary-500 scale-110'
                          : 'border-dark-500 hover:border-primary-500 hover:bg-primary-500/10'
                      }`}
                    >
                      {item.completed && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <span className={`flex-1 text-sm transition-all duration-200 ${
                      item.completed ? 'text-dark-400 line-through' : 'text-dark-200'
                    }`}>
                      {item.title}
                    </span>
                    <button 
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      className="p-1 hover:bg-accent-red/10 rounded text-dark-500 hover:text-accent-red opacity-0 group-hover:opacity-100 transition-all duration-200"
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
                  className="flex-1 bg-dark-800/50 border border-dark-600/50 rounded-lg px-4 py-2 text-sm text-dark-200 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200"
                  placeholder="Adicionar novo item..."
                />
                <button
                  onClick={handleAddChecklistItem}
                  className="bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 hover:text-primary-300 p-2 rounded-lg border border-primary-500/20 hover:border-primary-500/40 transition-all duration-200"
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
          <div className="w-96 border-l border-dark-700/50 bg-dark-800/30 p-6 overflow-y-auto">
            {/* Priority & Urgency */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Flag className="w-4 h-4 text-primary-400" />
                <label className="text-sm font-semibold text-dark-200">
                  Prioridade & Classificação
                </label>
              </div>
              
              <div className="space-y-4">
                <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-600/50">
                  <label className="block text-xs font-medium text-dark-400 mb-2">Prioridade</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      priority: e.target.value as 'HIGH' | 'MEDIUM' | 'LOW' 
                    }))}
                    className="w-full bg-dark-700/50 border border-dark-600/50 rounded-lg px-3 py-2 text-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200"
                  >
                    <option value="LOW">🟢 Baixa Prioridade</option>
                    <option value="MEDIUM">🟡 Média Prioridade</option>
                    <option value="HIGH">🔴 Alta Prioridade</option>
                  </select>
                </div>

                <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-600/50">
                  <label className="block text-xs font-medium text-dark-400 mb-2">Urgência</label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      urgency: e.target.value as 'URGENT' | 'NOT_URGENT' 
                    }))}
                    className="w-full bg-dark-700/50 border border-dark-600/50 rounded-lg px-3 py-2 text-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200"
                  >
                    <option value="NOT_URGENT">⏰ Não Urgente</option>
                    <option value="URGENT">⚡ Urgente</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg border border-dark-600/50 hover:bg-dark-700/50 transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <Target className="w-4 h-4 text-accent-yellow" />
                      <label htmlFor="highImpact" className="text-sm font-medium text-dark-200 cursor-pointer">
                        Alto Impacto
                      </label>
                    </div>
                    <input
                      type="checkbox"
                      id="highImpact"
                      checked={formData.highImpact}
                      onChange={(e) => setFormData(prev => ({ ...prev, highImpact: e.target.checked }))}
                      className="w-5 h-5 text-accent-yellow bg-dark-700 border-dark-600 rounded focus:ring-accent-yellow/50 transition-all duration-200"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg border border-dark-600/50 hover:bg-dark-700/50 transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <FolderKanban className="w-4 h-4 text-secondary-500" />
                      <label htmlFor="isProject" className="text-sm font-medium text-dark-200 cursor-pointer">
                        É um Projeto
                      </label>
                    </div>
                    <input
                      type="checkbox"
                      id="isProject"
                      checked={formData.isProject}
                      onChange={(e) => setFormData(prev => ({ ...prev, isProject: e.target.checked }))}
                      className="w-5 h-5 text-secondary-500 bg-dark-700 border-dark-600 rounded focus:ring-secondary-500/50 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-4 h-4 text-primary-400" />
                <label className="text-sm font-semibold text-dark-200">
                  Cronograma
                </label>
              </div>
              
              <div className="space-y-4">
                <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-600/50">
                  <label className="block text-xs font-medium text-dark-400 mb-2">Data de Início</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate ? new Date(formData.startDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                    className="w-full bg-dark-700/50 border border-dark-600/50 rounded-lg px-3 py-2 text-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200"
                  />
                </div>

                <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-600/50">
                  <label className="block text-xs font-medium text-dark-400 mb-2">Data de Término</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate ? new Date(formData.endDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                    className="w-full bg-dark-700/50 border border-dark-600/50 rounded-lg px-3 py-2 text-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200"
                  />
                  {formData.endDate && (
                    <div className="mt-2 text-xs text-dark-400">
                      Prazo: {(() => {
                        try {
                          return new Date(formData.endDate).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        } catch (error) {
                          return 'Data inválida'
                        }
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Assignment */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-4 h-4 text-primary-400" />
                <label className="text-sm font-semibold text-dark-200">
                  Equipe & Responsabilidade
                </label>
              </div>
              
              <div className="space-y-4">
                <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-600/50">
                  <label className="block text-xs font-medium text-dark-400 mb-3">Criado por</label>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {getInitials(formData.creator.name)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-dark-200">{formData.creator.name}</div>
                      <div className="text-xs text-dark-400">{formData.creator.email}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-600/50">
                  <label className="block text-xs font-medium text-dark-400 mb-3">Responsável</label>
                  <select 
                    value={formData.assignee?.id || ''}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    className="w-full bg-dark-700/50 border border-dark-600/50 rounded-lg px-3 py-2 text-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200"
                  >
                    <option value="">👤 Selecionar responsável</option>
                    <option value="1">👨‍💼 Luciano Filho</option>
                    <option value="2">👩‍💼 Edwa Favre</option>
                    <option value="3">👨‍💻 Marcos Barreto</option>
                  </select>
                  
                  {formData.assignee && (
                    <div className="mt-3 flex items-center space-x-3 p-2 bg-dark-700/30 rounded-lg">
                      <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {getInitials(formData.assignee.name)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-dark-200">{formData.assignee.name}</div>
                        <div className="text-xs text-dark-400">{formData.assignee.email}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <Activity className="w-4 h-4 text-primary-400" />
                <label className="text-sm font-semibold text-dark-200">
                  Ações Rápidas
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center space-x-2 p-3 bg-dark-800/50 hover:bg-dark-700/50 rounded-lg border border-dark-600/50 hover:border-primary-500/50 transition-all duration-200 text-sm">
                  <MessageSquare className="w-4 h-4 text-dark-400" />
                  <span className="text-dark-300">Comentários</span>
                </button>
                <button className="flex items-center space-x-2 p-3 bg-dark-800/50 hover:bg-dark-700/50 rounded-lg border border-dark-600/50 hover:border-primary-500/50 transition-all duration-200 text-sm">
                  <Paperclip className="w-4 h-4 text-dark-400" />
                  <span className="text-dark-300">Anexos</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 disabled:from-dark-600 disabled:to-dark-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading && <ButtonSpinner />}
                <Save className="w-4 h-4" />
                <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
              
              <button
                onClick={onClose}
                disabled={loading}
                className="w-full bg-dark-700/50 hover:bg-dark-600/50 text-dark-300 hover:text-dark-200 font-medium py-3 px-4 rounded-xl transition-all duration-200 border border-dark-600/50 hover:border-dark-500/50 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>

            {/* Card Info */}
            <div className="mt-6 pt-6 border-t border-dark-700/50">
              <div className="text-xs text-dark-500 space-y-1">
                <div>ID: {card.id}</div>
                <div>Criado: {new Date().toLocaleDateString('pt-BR')}</div>
                <div>Atualizado: {new Date().toLocaleDateString('pt-BR')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}