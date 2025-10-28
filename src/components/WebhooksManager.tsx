'use client'

import { useState, useEffect } from 'react'
import { 
  Webhook, 
  Plus, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  Copy,
  Eye,
  RefreshCw
} from 'lucide-react'
import { useToast } from './ToastContainer'
import ResponsiveModal from './ResponsiveModal'

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  secret: string
  isActive: boolean
  retryCount: number
  maxRetries: number
  timeout: number
  headers?: { [key: string]: string }
  createdAt: string
  updatedAt: string
  lastTriggered?: string
  lastStatus?: 'success' | 'failed' | 'timeout'
  failureCount: number
}

interface WebhookEvent {
  id: string
  event: string
  data: any
  timestamp: string
  webhookId: string
  status: 'pending' | 'sent' | 'failed' | 'retrying'
  attempts: number
  lastAttempt?: string
  response?: {
    status: number
    body: string
    headers: { [key: string]: string }
  }
}

export default function WebhooksManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showEventsModal, setShowEventsModal] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null)
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([])
  const { showSuccess, showError } = useToast()

  const availableEvents = [
    { id: 'card.created', name: 'Card Criado', description: 'Quando um novo card é criado' },
    { id: 'card.updated', name: 'Card Atualizado', description: 'Quando um card é modificado' },
    { id: 'card.assigned', name: 'Card Atribuído', description: 'Quando um card é atribuído a alguém' },
    { id: 'card.completed', name: 'Card Concluído', description: 'Quando um card é marcado como concluído' },
    { id: 'card.deleted', name: 'Card Excluído', description: 'Quando um card é removido' },
    { id: 'project.created', name: 'Projeto Criado', description: 'Quando um novo projeto é criado' },
    { id: 'project.updated', name: 'Projeto Atualizado', description: 'Quando um projeto é modificado' },
    { id: 'project.completed', name: 'Projeto Concluído', description: 'Quando um projeto é finalizado' },
    { id: 'project.deadline_approaching', name: 'Prazo Próximo', description: 'Quando o prazo de um projeto está próximo' },
    { id: 'team.created', name: 'Equipe Criada', description: 'Quando uma nova equipe é criada' },
    { id: 'team.member_added', name: 'Membro Adicionado', description: 'Quando um membro é adicionado à equipe' },
    { id: 'comment.created', name: 'Comentário Criado', description: 'Quando um novo comentário é adicionado' }
  ]

  useEffect(() => {
    loadWebhooks()
  }, [])

  const loadWebhooks = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/webhooks')
      if (response.ok) {
        const data = await response.json()
        setWebhooks(data.webhooks || [])
      }
    } catch (error) {
      showError('Erro', 'Falha ao carregar webhooks')
    } finally {
      setLoading(false)
    }
  }

  const loadWebhookEvents = async (webhookId: string) => {
    try {
      const response = await fetch(`/api/webhooks?id=${webhookId}&includeEvents=true`)
      if (response.ok) {
        const data = await response.json()
        setWebhookEvents(data.events || [])
      }
    } catch (error) {
      showError('Erro', 'Falha ao carregar eventos do webhook')
    }
  }

  const toggleWebhook = async (webhook: Webhook) => {
    try {
      const response = await fetch('/api/webhooks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: webhook.id,
          isActive: !webhook.isActive
        })
      })

      if (response.ok) {
        await loadWebhooks()
        showSuccess('Webhook Atualizado', `Webhook ${webhook.isActive ? 'desativado' : 'ativado'} com sucesso`)
      }
    } catch (error) {
      showError('Erro', 'Falha ao atualizar webhook')
    }
  }

  const deleteWebhook = async (webhookId: string) => {
    try {
      const response = await fetch(`/api/webhooks?id=${webhookId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadWebhooks()
        showSuccess('Webhook Excluído', 'Webhook removido com sucesso')
      }
    } catch (error) {
      showError('Erro', 'Falha ao excluir webhook')
    }
  }

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret)
    showSuccess('Copiado', 'Secret copiado para a área de transferência')
  }

  const testWebhook = async (webhook: Webhook) => {
    try {
      // Simular evento de teste
      const testData = {
        id: 'test_card_123',
        title: 'Card de Teste',
        description: 'Este é um card de teste para validar o webhook',
        priority: 'MEDIUM',
        assignee: {
          id: 'user_1',
          name: 'Usuário Teste',
          email: 'teste@exemplo.com'
        },
        createdAt: new Date().toISOString()
      }

      // Disparar evento de teste
      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookId: webhook.id,
          event: 'card.created',
          data: testData
        })
      })

      if (response.ok) {
        showSuccess('Teste Enviado', 'Evento de teste enviado para o webhook')
      }
    } catch (error) {
      showError('Erro', 'Falha ao testar webhook')
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      case 'timeout':
        return <Clock className="w-4 h-4 text-yellow-400" />
      default:
        return <Clock className="w-4 h-4 text-dark-500" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'text-green-400'
      case 'failed': return 'text-red-400'
      case 'timeout': return 'text-yellow-400'
      default: return 'text-dark-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-50">Webhooks</h2>
          <p className="text-dark-400 mt-1">
            Gerencie integrações automáticas com sistemas externos
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Webhook
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-dark-400 mt-2">Carregando webhooks...</p>
        </div>
      )}

      {/* Webhooks List */}
      {!loading && (
        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="bg-dark-800 border border-dark-700 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-dark-50">{webhook.name}</h3>
                    <div className="flex items-center space-x-2">
                      {webhook.isActive ? (
                        <span className="flex items-center text-green-400 text-sm">
                          <Power className="w-3 h-3 mr-1" />
                          Ativo
                        </span>
                      ) : (
                        <span className="flex items-center text-dark-500 text-sm">
                          <PowerOff className="w-3 h-3 mr-1" />
                          Inativo
                        </span>
                      )}
                      {getStatusIcon(webhook.lastStatus)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-dark-400 mb-2">
                    <ExternalLink className="w-3 h-3" />
                    <span className="font-mono">{webhook.url}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {webhook.events.slice(0, 3).map((event) => (
                      <span
                        key={event}
                        className="px-2 py-1 bg-dark-700 text-dark-300 text-xs rounded"
                      >
                        {availableEvents.find(e => e.id === event)?.name || event}
                      </span>
                    ))}
                    {webhook.events.length > 3 && (
                      <span className="px-2 py-1 bg-dark-600 text-dark-400 text-xs rounded">
                        +{webhook.events.length - 3} mais
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-dark-500">
                    <div>
                      <span className="block text-dark-400">Último Disparo</span>
                      {webhook.lastTriggered 
                        ? new Date(webhook.lastTriggered).toLocaleString('pt-BR')
                        : 'Nunca'
                      }
                    </div>
                    <div>
                      <span className="block text-dark-400">Status</span>
                      <span className={getStatusColor(webhook.lastStatus)}>
                        {webhook.lastStatus === 'success' ? 'Sucesso' :
                         webhook.lastStatus === 'failed' ? 'Falha' :
                         webhook.lastStatus === 'timeout' ? 'Timeout' : 'Pendente'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-dark-400">Falhas</span>
                      {webhook.failureCount}
                    </div>
                    <div>
                      <span className="block text-dark-400">Timeout</span>
                      {webhook.timeout / 1000}s
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedWebhook(webhook)
                      loadWebhookEvents(webhook.id)
                      setShowEventsModal(true)
                    }}
                    className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-primary-500 transition-colors"
                    title="Ver Eventos"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => testWebhook(webhook)}
                    className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-primary-500 transition-colors"
                    title="Testar Webhook"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => copySecret(webhook.secret)}
                    className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-primary-500 transition-colors"
                    title="Copiar Secret"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedWebhook(webhook)
                      setShowEditModal(true)
                    }}
                    className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-primary-500 transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => toggleWebhook(webhook)}
                    className={`p-2 hover:bg-dark-700 rounded-lg transition-colors ${
                      webhook.isActive 
                        ? 'text-green-400 hover:text-green-300' 
                        : 'text-dark-500 hover:text-green-400'
                    }`}
                    title={webhook.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {webhook.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => deleteWebhook(webhook.id)}
                    className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-red-400 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && webhooks.length === 0 && (
        <div className="text-center py-12">
          <Webhook className="w-16 h-16 text-dark-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark-300 mb-2">Nenhum webhook configurado</h3>
          <p className="text-dark-500 mb-6">
            Configure webhooks para integrar automaticamente com sistemas externos
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Webhook
          </button>
        </div>
      )}

      {/* Modals */}
      <WebhookCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          loadWebhooks()
        }}
        availableEvents={availableEvents}
      />

      <WebhookEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        webhook={selectedWebhook}
        onSuccess={() => {
          setShowEditModal(false)
          loadWebhooks()
        }}
        availableEvents={availableEvents}
      />

      <WebhookEventsModal
        isOpen={showEventsModal}
        onClose={() => setShowEventsModal(false)}
        webhook={selectedWebhook}
        events={webhookEvents}
      />
    </div>
  )
}

// Modal para criar webhook
function WebhookCreateModal({ isOpen, onClose, onSuccess, availableEvents }: any) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    maxRetries: 3,
    timeout: 30000,
    headers: ''
  })
  const [loading, setLoading] = useState(false)
  const { showSuccess, showError } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let headers = {}
      if (formData.headers.trim()) {
        headers = JSON.parse(formData.headers)
      }

      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          headers
        })
      })

      if (response.ok) {
        showSuccess('Webhook Criado', 'Webhook configurado com sucesso')
        onSuccess()
      } else {
        const error = await response.json()
        showError('Erro', error.error || 'Falha ao criar webhook')
      }
    } catch (error) {
      showError('Erro', 'Falha ao criar webhook')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Webhook"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Nome *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="input-field w-full"
            placeholder="Ex: Integração LECOM"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">
            URL do Endpoint *
          </label>
          <input
            type="url"
            value={formData.url}
            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
            className="input-field w-full"
            placeholder="https://api.exemplo.com/webhook"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Eventos *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-dark-600 rounded-lg p-3">
            {availableEvents.map((event: any) => (
              <label key={event.id} className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  checked={formData.events.includes(event.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({ ...prev, events: [...prev.events, event.id] }))
                    } else {
                      setFormData(prev => ({ ...prev, events: prev.events.filter(id => id !== event.id) }))
                    }
                  }}
                  className="mt-0.5 rounded border-dark-600 text-primary-500 focus:ring-primary-500"
                />
                <div>
                  <div className="text-sm text-dark-200">{event.name}</div>
                  <div className="text-xs text-dark-500">{event.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Máx. Tentativas
            </label>
            <input
              type="number"
              value={formData.maxRetries}
              onChange={(e) => setFormData(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
              className="input-field w-full"
              min="1"
              max="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Timeout (ms)
            </label>
            <input
              type="number"
              value={formData.timeout}
              onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
              className="input-field w-full"
              min="1000"
              max="60000"
              step="1000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Headers Customizados (JSON)
          </label>
          <textarea
            value={formData.headers}
            onChange={(e) => setFormData(prev => ({ ...prev, headers: e.target.value }))}
            className="input-field w-full h-24 font-mono text-sm"
            placeholder='{"Authorization": "Bearer token", "Custom-Header": "value"}'
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading || formData.events.length === 0}
            className="btn-primary flex-1"
          >
            {loading ? 'Criando...' : 'Criar Webhook'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </ResponsiveModal>
  )
}

// Modal para editar webhook (similar ao create)
function WebhookEditModal({ isOpen, onClose, webhook, onSuccess, availableEvents }: any) {
  // Implementação similar ao create modal
  return null
}

// Modal para visualizar eventos do webhook
function WebhookEventsModal({ isOpen, onClose, webhook, events }: any) {
  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Eventos - ${webhook?.name}`}
      size="xl"
    >
      <div className="p-6">
        <div className="space-y-3">
          {events.map((event: WebhookEvent) => (
            <div key={event.id} className="bg-dark-700 border border-dark-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-dark-200">{event.event}</span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    event.status === 'sent' ? 'bg-green-500/20 text-green-400' :
                    event.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    event.status === 'retrying' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {event.status}
                  </span>
                </div>
                <span className="text-xs text-dark-500">
                  {new Date(event.timestamp).toLocaleString('pt-BR')}
                </span>
              </div>
              
              <div className="text-xs text-dark-400">
                Tentativas: {event.attempts}
                {event.response && (
                  <span className="ml-4">
                    Status HTTP: {event.response.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-dark-500 mx-auto mb-3" />
            <p className="text-dark-400">Nenhum evento registrado ainda</p>
          </div>
        )}
      </div>
    </ResponsiveModal>
  )
}