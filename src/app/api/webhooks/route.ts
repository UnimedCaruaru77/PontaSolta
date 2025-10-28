import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

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

// Simulação de banco de dados de webhooks
let webhooks: Webhook[] = [
  {
    id: 'webhook_1',
    name: 'Integração LECOM',
    url: 'https://api.lecom.com.br/webhooks/pontasolta',
    events: ['card.created', 'card.updated', 'card.completed', 'project.created'],
    secret: 'lecom_secret_key_123',
    isActive: true,
    retryCount: 0,
    maxRetries: 3,
    timeout: 30000,
    headers: {
      'Authorization': 'Bearer lecom_api_token',
      'Content-Type': 'application/json'
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    failureCount: 0
  },
  {
    id: 'webhook_2',
    name: 'Sistema de Notificações',
    url: 'https://api.exemplo.com/notifications/webhook',
    events: ['card.assigned', 'card.completed', 'project.deadline_approaching'],
    secret: 'notification_webhook_secret',
    isActive: true,
    retryCount: 0,
    maxRetries: 2,
    timeout: 15000,
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
    failureCount: 0
  }
]

let webhookEvents: WebhookEvent[] = []

// Função para gerar assinatura do webhook
function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}

// Função para enviar webhook
async function sendWebhook(webhook: Webhook, event: WebhookEvent): Promise<boolean> {
  try {
    const payload = JSON.stringify({
      id: event.id,
      event: event.event,
      data: event.data,
      timestamp: event.timestamp
    })

    const signature = generateSignature(payload, webhook.secret)
    
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': `sha256=${signature}`,
      'X-Webhook-Event': event.event,
      'X-Webhook-ID': event.id,
      'User-Agent': 'PontaSolta-Webhook/1.0',
      ...webhook.headers
    }

    console.log(`🔗 Enviando webhook para ${webhook.name}:`, {
      url: webhook.url,
      event: event.event,
      attempt: event.attempts + 1
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), webhook.timeout)

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: payload,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    // Atualizar evento com resposta
    event.response = {
      status: response.status,
      body: await response.text(),
      headers: Object.fromEntries(response.headers.entries())
    }

    const success = response.ok
    
    if (success) {
      event.status = 'sent'
      webhook.lastTriggered = new Date().toISOString()
      webhook.lastStatus = 'success'
      webhook.failureCount = 0
    } else {
      event.status = 'failed'
      webhook.lastStatus = 'failed'
      webhook.failureCount++
    }

    event.lastAttempt = new Date().toISOString()
    event.attempts++

    return success
  } catch (error) {
    console.error(`Erro ao enviar webhook ${webhook.name}:`, error)
    
    event.status = 'failed'
    event.lastAttempt = new Date().toISOString()
    event.attempts++
    webhook.lastStatus = error.name === 'AbortError' ? 'timeout' : 'failed'
    webhook.failureCount++

    return false
  }
}

// Função para processar fila de webhooks
async function processWebhookQueue() {
  const pendingEvents = webhookEvents.filter(event => 
    event.status === 'pending' || 
    (event.status === 'failed' && event.attempts < webhooks.find(w => w.id === event.webhookId)?.maxRetries)
  )

  for (const event of pendingEvents) {
    const webhook = webhooks.find(w => w.id === event.webhookId)
    if (!webhook || !webhook.isActive) continue

    if (event.status === 'failed') {
      event.status = 'retrying'
    }

    const success = await sendWebhook(webhook, event)
    
    if (!success && event.attempts >= webhook.maxRetries) {
      event.status = 'failed'
      console.error(`Webhook ${webhook.name} falhou após ${webhook.maxRetries} tentativas`)
    }
  }
}

// Função para disparar evento de webhook
export async function triggerWebhookEvent(eventType: string, data: any) {
  const activeWebhooks = webhooks.filter(webhook => 
    webhook.isActive && webhook.events.includes(eventType)
  )

  for (const webhook of activeWebhooks) {
    const event: WebhookEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event: eventType,
      data,
      timestamp: new Date().toISOString(),
      webhookId: webhook.id,
      status: 'pending',
      attempts: 0
    }

    webhookEvents.push(event)
  }

  // Processar fila em background
  setTimeout(processWebhookQueue, 100)
}

// GET - Listar webhooks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const webhookId = searchParams.get('id')
    const includeEvents = searchParams.get('includeEvents') === 'true'

    if (webhookId) {
      const webhook = webhooks.find(w => w.id === webhookId)
      if (!webhook) {
        return NextResponse.json(
          { error: 'Webhook não encontrado' },
          { status: 404 }
        )
      }

      const result: any = { webhook }
      
      if (includeEvents) {
        result.events = webhookEvents
          .filter(e => e.webhookId === webhookId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 50) // Últimos 50 eventos
      }

      return NextResponse.json(result)
    }

    return NextResponse.json({ 
      webhooks: webhooks.map(webhook => ({
        ...webhook,
        secret: undefined // Não retornar secret por segurança
      }))
    })
  } catch (error) {
    console.error('Erro ao buscar webhooks:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, url, events, secret, headers, maxRetries = 3, timeout = 30000 } = body

    // Validações
    if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Nome, URL e eventos são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'URL inválida' },
        { status: 400 }
      )
    }

    // Eventos disponíveis
    const availableEvents = [
      'card.created',
      'card.updated',
      'card.assigned',
      'card.completed',
      'card.deleted',
      'project.created',
      'project.updated',
      'project.completed',
      'project.deleted',
      'project.deadline_approaching',
      'team.created',
      'team.updated',
      'team.member_added',
      'team.member_removed',
      'comment.created',
      'comment.updated',
      'comment.deleted'
    ]

    // Validar eventos
    const invalidEvents = events.filter(event => !availableEvents.includes(event))
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Eventos inválidos: ${invalidEvents.join(', ')}` },
        { status: 400 }
      )
    }

    const webhook: Webhook = {
      id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      url,
      events,
      secret: secret || crypto.randomBytes(32).toString('hex'),
      isActive: true,
      retryCount: 0,
      maxRetries,
      timeout,
      headers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      failureCount: 0
    }

    webhooks.push(webhook)

    return NextResponse.json({
      success: true,
      webhook: {
        ...webhook,
        secret: undefined // Não retornar secret na resposta
      }
    })
  } catch (error) {
    console.error('Erro ao criar webhook:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar webhook
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, url, events, secret, headers, maxRetries, timeout, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID do webhook é obrigatório' },
        { status: 400 }
      )
    }

    const webhookIndex = webhooks.findIndex(w => w.id === id)
    if (webhookIndex === -1) {
      return NextResponse.json(
        { error: 'Webhook não encontrado' },
        { status: 404 }
      )
    }

    const webhook = webhooks[webhookIndex]
    
    // Atualizar campos
    if (name !== undefined) webhook.name = name
    if (url !== undefined) webhook.url = url
    if (events !== undefined) webhook.events = events
    if (secret !== undefined) webhook.secret = secret
    if (headers !== undefined) webhook.headers = headers
    if (maxRetries !== undefined) webhook.maxRetries = maxRetries
    if (timeout !== undefined) webhook.timeout = timeout
    if (isActive !== undefined) webhook.isActive = isActive
    
    webhook.updatedAt = new Date().toISOString()

    return NextResponse.json({
      success: true,
      webhook: {
        ...webhook,
        secret: undefined
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar webhook:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir webhook
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do webhook é obrigatório' },
        { status: 400 }
      )
    }

    const webhookIndex = webhooks.findIndex(w => w.id === id)
    if (webhookIndex === -1) {
      return NextResponse.json(
        { error: 'Webhook não encontrado' },
        { status: 404 }
      )
    }

    webhooks.splice(webhookIndex, 1)
    
    // Remover eventos relacionados
    webhookEvents = webhookEvents.filter(e => e.webhookId !== id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir webhook:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Eventos pré-definidos para teste
export const webhookEventTypes = {
  CARD_CREATED: 'card.created',
  CARD_UPDATED: 'card.updated',
  CARD_ASSIGNED: 'card.assigned',
  CARD_COMPLETED: 'card.completed',
  CARD_DELETED: 'card.deleted',
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  PROJECT_COMPLETED: 'project.completed',
  PROJECT_DELETED: 'project.deleted',
  PROJECT_DEADLINE_APPROACHING: 'project.deadline_approaching',
  TEAM_CREATED: 'team.created',
  TEAM_UPDATED: 'team.updated',
  TEAM_MEMBER_ADDED: 'team.member_added',
  TEAM_MEMBER_REMOVED: 'team.member_removed',
  COMMENT_CREATED: 'comment.created',
  COMMENT_UPDATED: 'comment.updated',
  COMMENT_DELETED: 'comment.deleted'
}

// Funções utilitárias para disparar eventos específicos
export const webhookTriggers = {
  cardCreated: (cardData: any) => triggerWebhookEvent(webhookEventTypes.CARD_CREATED, cardData),
  cardUpdated: (cardData: any) => triggerWebhookEvent(webhookEventTypes.CARD_UPDATED, cardData),
  cardAssigned: (cardData: any) => triggerWebhookEvent(webhookEventTypes.CARD_ASSIGNED, cardData),
  cardCompleted: (cardData: any) => triggerWebhookEvent(webhookEventTypes.CARD_COMPLETED, cardData),
  projectCreated: (projectData: any) => triggerWebhookEvent(webhookEventTypes.PROJECT_CREATED, projectData),
  projectUpdated: (projectData: any) => triggerWebhookEvent(webhookEventTypes.PROJECT_UPDATED, projectData)
}