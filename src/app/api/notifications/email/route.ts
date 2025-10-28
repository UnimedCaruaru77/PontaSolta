import { NextRequest, NextResponse } from 'next/server'

interface EmailNotification {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  template: string
  data: any
  priority: 'low' | 'normal' | 'high' | 'urgent'
  scheduledFor?: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent: string
  variables: string[]
}

// Templates de email pré-definidos
const emailTemplates: { [key: string]: EmailTemplate } = {
  'card-assigned': {
    id: 'card-assigned',
    name: 'Card Atribuído',
    subject: 'Nova tarefa atribuída: {{cardTitle}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Ponta Solta</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Nova tarefa atribuída para você!</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
            <h3 style="color: #667eea; margin-top: 0;">{{cardTitle}}</h3>
            <p style="color: #666; margin-bottom: 15px;">{{cardDescription}}</p>
            
            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
              <div>
                <strong>Projeto:</strong> {{projectName}}
              </div>
              <div>
                <strong>Prioridade:</strong> 
                <span style="color: {{priorityColor}};">{{priority}}</span>
              </div>
              <div>
                <strong>Prazo:</strong> {{dueDate}}
              </div>
            </div>
            
            <a href="{{cardUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver Tarefa
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; margin-top: 20px;">
            Atribuído por: {{assignedBy}} em {{assignedAt}}
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2024 Ponta Solta - Sistema de Gestão de Demandas</p>
          <p>
            <a href="{{unsubscribeUrl}}" style="color: #ccc;">Cancelar inscrição</a>
          </p>
        </div>
      </div>
    `,
    textContent: `
Nova tarefa atribuída: {{cardTitle}}

{{cardDescription}}

Projeto: {{projectName}}
Prioridade: {{priority}}
Prazo: {{dueDate}}

Atribuído por: {{assignedBy}} em {{assignedAt}}

Ver tarefa: {{cardUrl}}

---
Ponta Solta - Sistema de Gestão de Demandas
Para cancelar inscrições: {{unsubscribeUrl}}
    `,
    variables: ['cardTitle', 'cardDescription', 'projectName', 'priority', 'priorityColor', 'dueDate', 'assignedBy', 'assignedAt', 'cardUrl', 'unsubscribeUrl']
  },
  
  'card-due-reminder': {
    id: 'card-due-reminder',
    name: 'Lembrete de Prazo',
    subject: 'Lembrete: {{cardTitle}} vence em {{daysUntilDue}} dias',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">⏰ Lembrete de Prazo</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Sua tarefa está próxima do prazo!</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f5576c;">
            <h3 style="color: #f5576c; margin-top: 0;">{{cardTitle}}</h3>
            <p style="color: #666; margin-bottom: 15px;">{{cardDescription}}</p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <strong style="color: #856404;">
                ⚠️ Vence em {{daysUntilDue}} dias ({{dueDate}})
              </strong>
            </div>
            
            <a href="{{cardUrl}}" style="background: #f5576c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Trabalhar na Tarefa
            </a>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2024 Ponta Solta - Sistema de Gestão de Demandas</p>
        </div>
      </div>
    `,
    textContent: `
Lembrete: {{cardTitle}} vence em {{daysUntilDue}} dias

{{cardDescription}}

Prazo: {{dueDate}}

Ver tarefa: {{cardUrl}}

---
Ponta Solta - Sistema de Gestão de Demandas
    `,
    variables: ['cardTitle', 'cardDescription', 'daysUntilDue', 'dueDate', 'cardUrl']
  },
  
  'project-status-update': {
    id: 'project-status-update',
    name: 'Atualização de Projeto',
    subject: 'Atualização do projeto: {{projectName}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">📊 Atualização de Projeto</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">{{projectName}}</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #4facfe;">
            <p style="color: #666; margin-bottom: 20px;">{{updateMessage}}</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                <strong>Status:</strong> {{status}}
              </div>
              <div>
                <strong>Progresso:</strong> {{progress}}%
              </div>
              <div>
                <strong>Tarefas Concluídas:</strong> {{completedTasks}}/{{totalTasks}}
              </div>
              <div>
                <strong>Prazo:</strong> {{deadline}}
              </div>
            </div>
            
            <a href="{{projectUrl}}" style="background: #4facfe; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver Projeto
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; margin-top: 20px;">
            Atualizado por: {{updatedBy}} em {{updatedAt}}
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2024 Ponta Solta - Sistema de Gestão de Demandas</p>
        </div>
      </div>
    `,
    textContent: `
Atualização do projeto: {{projectName}}

{{updateMessage}}

Status: {{status}}
Progresso: {{progress}}%
Tarefas Concluídas: {{completedTasks}}/{{totalTasks}}
Prazo: {{deadline}}

Ver projeto: {{projectUrl}}

Atualizado por: {{updatedBy}} em {{updatedAt}}

---
Ponta Solta - Sistema de Gestão de Demandas
    `,
    variables: ['projectName', 'updateMessage', 'status', 'progress', 'completedTasks', 'totalTasks', 'deadline', 'projectUrl', 'updatedBy', 'updatedAt']
  }
}

// Função para processar template
function processTemplate(template: EmailTemplate, data: any): { subject: string; html: string; text: string } {
  let subject = template.subject
  let html = template.htmlContent
  let text = template.textContent

  // Substituir variáveis
  template.variables.forEach(variable => {
    const value = data[variable] || ''
    const placeholder = `{{${variable}}}`
    
    subject = subject.replace(new RegExp(placeholder, 'g'), value)
    html = html.replace(new RegExp(placeholder, 'g'), value)
    text = text.replace(new RegExp(placeholder, 'g'), value)
  })

  return { subject, html, text }
}

// Função para enviar email (simulação)
async function sendEmail(notification: EmailNotification): Promise<boolean> {
  try {
    // Em produção, usar serviço real como SendGrid, AWS SES, etc.
    console.log('📧 Enviando email:', {
      to: notification.to,
      subject: notification.subject,
      priority: notification.priority,
      scheduledFor: notification.scheduledFor
    })

    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Simular sucesso (95% de taxa de sucesso)
    return Math.random() > 0.05
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return false
  }
}

// POST - Enviar notificação por email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { template: templateId, data, to, cc, bcc, priority = 'normal', scheduledFor } = body

    // Validações
    if (!templateId || !data || !to || to.length === 0) {
      return NextResponse.json(
        { error: 'Template, dados e destinatários são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se template existe
    const template = emailTemplates[templateId]
    if (!template) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      )
    }

    // Processar template
    const processedTemplate = processTemplate(template, data)

    // Criar notificação
    const notification: EmailNotification = {
      to: Array.isArray(to) ? to : [to],
      cc,
      bcc,
      subject: processedTemplate.subject,
      template: templateId,
      data,
      priority,
      scheduledFor
    }

    // Enviar email
    if (scheduledFor && new Date(scheduledFor) > new Date()) {
      // Agendar para envio futuro
      console.log('📅 Email agendado para:', scheduledFor)
      
      return NextResponse.json({
        success: true,
        message: 'Email agendado com sucesso',
        scheduledFor,
        notification: {
          id: `email_${Date.now()}`,
          status: 'scheduled',
          ...notification
        }
      })
    } else {
      // Enviar imediatamente
      const success = await sendEmail(notification)
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Email enviado com sucesso',
          notification: {
            id: `email_${Date.now()}`,
            status: 'sent',
            sentAt: new Date().toISOString(),
            ...notification
          }
        })
      } else {
        return NextResponse.json(
          { error: 'Falha ao enviar email' },
          { status: 500 }
        )
      }
    }
  } catch (error) {
    console.error('Erro na API de email:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Listar templates disponíveis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('template')

    if (templateId) {
      // Retornar template específico
      const template = emailTemplates[templateId]
      if (!template) {
        return NextResponse.json(
          { error: 'Template não encontrado' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        template: {
          ...template,
          // Não retornar conteúdo completo por segurança
          htmlContent: undefined,
          textContent: undefined
        }
      })
    } else {
      // Listar todos os templates
      const templates = Object.values(emailTemplates).map(template => ({
        id: template.id,
        name: template.name,
        subject: template.subject,
        variables: template.variables
      }))

      return NextResponse.json({ templates })
    }
  } catch (error) {
    console.error('Erro ao buscar templates:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função utilitária para envio de notificações específicas
export const emailNotifications = {
  // Notificar atribuição de card
  async notifyCardAssigned(cardId: string, assigneeEmail: string, assignedBy: string) {
    try {
      // Em produção, buscar dados do card da API
      const cardData = {
        cardTitle: 'Implementar nova funcionalidade',
        cardDescription: 'Desenvolver sistema de notificações por email',
        projectName: 'Ponta Solta v2.0',
        priority: 'Alta',
        priorityColor: '#f5576c',
        dueDate: '15/02/2024',
        assignedBy,
        assignedAt: new Date().toLocaleString('pt-BR'),
        cardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/kanban?card=${cardId}`,
        unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`
      }

      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: 'card-assigned',
          to: [assigneeEmail],
          data: cardData,
          priority: 'normal'
        })
      })

      return response.ok
    } catch (error) {
      console.error('Erro ao notificar atribuição:', error)
      return false
    }
  },

  // Lembrete de prazo
  async sendDueReminder(cardId: string, assigneeEmail: string, daysUntilDue: number) {
    try {
      const cardData = {
        cardTitle: 'Implementar nova funcionalidade',
        cardDescription: 'Desenvolver sistema de notificações por email',
        daysUntilDue: daysUntilDue.toString(),
        dueDate: '15/02/2024',
        cardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/kanban?card=${cardId}`
      }

      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: 'card-due-reminder',
          to: [assigneeEmail],
          data: cardData,
          priority: 'high'
        })
      })

      return response.ok
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error)
      return false
    }
  },

  // Atualização de projeto
  async notifyProjectUpdate(projectId: string, teamEmails: string[], updateData: any) {
    try {
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: 'project-status-update',
          to: teamEmails,
          data: updateData,
          priority: 'normal'
        })
      })

      return response.ok
    } catch (error) {
      console.error('Erro ao notificar atualização:', error)
      return false
    }
  }
}