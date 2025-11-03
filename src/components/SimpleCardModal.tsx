'use client'

import { X, Calendar, User, Flag, AlertTriangle } from 'lucide-react'

interface SimpleCardModalProps {
  card: any
  isOpen: boolean
  onClose: () => void
}

export default function SimpleCardModal({ card, isOpen, onClose }: SimpleCardModalProps) {
  if (!isOpen || !card) return null

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-400'
      case 'MEDIUM': return 'text-yellow-400'
      case 'LOW': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'Alta'
      case 'MEDIUM': return 'Média'
      case 'LOW': return 'Baixa'
      default: return priority
    }
  }

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'URGENT': return 'Urgente'
      case 'NOT_URGENT': return 'Não Urgente'
      default: return urgency
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '12px',
        padding: '24px',
        width: '100%',
        maxWidth: '600px',
        margin: '16px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #374151'
        }}>
          <h2 style={{ 
            color: '#f9fafb', 
            fontSize: '20px', 
            fontWeight: '600',
            margin: 0
          }}>
            Detalhes do Card
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: '#9ca3af',
              cursor: 'pointer'
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Título */}
          <div>
            <label style={{ 
              display: 'block', 
              color: '#d1d5db', 
              fontSize: '14px', 
              fontWeight: '500',
              marginBottom: '8px' 
            }}>
              Título
            </label>
            <div style={{
              padding: '12px',
              backgroundColor: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '6px',
              color: '#f9fafb',
              fontSize: '16px'
            }}>
              {card.title}
            </div>
          </div>

          {/* Descrição */}
          {card.description && (
            <div>
              <label style={{ 
                display: 'block', 
                color: '#d1d5db', 
                fontSize: '14px', 
                fontWeight: '500',
                marginBottom: '8px' 
              }}>
                Descrição
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: '#f9fafb',
                fontSize: '14px',
                minHeight: '60px'
              }}>
                {card.description}
              </div>
            </div>
          )}

          {/* Informações em Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px' 
          }}>
            {/* Prioridade */}
            <div>
              <label style={{ 
                display: 'block', 
                color: '#d1d5db', 
                fontSize: '14px', 
                fontWeight: '500',
                marginBottom: '8px' 
              }}>
                <Flag style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px' }} />
                Prioridade
              </label>
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                fontSize: '14px'
              }} className={getPriorityColor(card.priority)}>
                {getPriorityLabel(card.priority)}
              </div>
            </div>

            {/* Urgência */}
            <div>
              <label style={{ 
                display: 'block', 
                color: '#d1d5db', 
                fontSize: '14px', 
                fontWeight: '500',
                marginBottom: '8px' 
              }}>
                <AlertTriangle style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px' }} />
                Urgência
              </label>
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: '#f9fafb',
                fontSize: '14px'
              }}>
                {getUrgencyLabel(card.urgency)}
              </div>
            </div>
          </div>

          {/* Flags */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px' 
          }}>
            <div style={{
              padding: '12px',
              backgroundColor: card.high_impact ? '#065f46' : '#374151',
              border: `1px solid ${card.high_impact ? '#10b981' : '#4b5563'}`,
              borderRadius: '6px',
              textAlign: 'center',
              color: card.high_impact ? '#10b981' : '#9ca3af',
              fontSize: '14px'
            }}>
              {card.high_impact ? '✓' : '✗'} Alto Impacto
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: card.is_project ? '#1e40af' : '#374151',
              border: `1px solid ${card.is_project ? '#3b82f6' : '#4b5563'}`,
              borderRadius: '6px',
              textAlign: 'center',
              color: card.is_project ? '#3b82f6' : '#9ca3af',
              fontSize: '14px'
            }}>
              {card.is_project ? '✓' : '✗'} É um Projeto
            </div>
          </div>

          {/* Datas */}
          {(card.start_date || card.end_date) && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px' 
            }}>
              {card.start_date && (
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: '#d1d5db', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    marginBottom: '8px' 
                  }}>
                    <Calendar style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px' }} />
                    Data de Início
                  </label>
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    color: '#f9fafb',
                    fontSize: '14px'
                  }}>
                    {new Date(card.start_date).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              )}

              {card.end_date && (
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: '#d1d5db', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    marginBottom: '8px' 
                  }}>
                    <Calendar style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px' }} />
                    Data de Término
                  </label>
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    color: '#f9fafb',
                    fontSize: '14px'
                  }}>
                    {new Date(card.end_date).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Responsável */}
          {card.assignee && (
            <div>
              <label style={{ 
                display: 'block', 
                color: '#d1d5db', 
                fontSize: '14px', 
                fontWeight: '500',
                marginBottom: '8px' 
              }}>
                <User style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px' }} />
                Responsável
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: '#f9fafb',
                fontSize: '14px'
              }}>
                {card.assignee.name} ({card.assignee.email})
              </div>
            </div>
          )}

          {/* Ticket LECOM */}
          {card.lecom_ticket && (
            <div>
              <label style={{ 
                display: 'block', 
                color: '#d1d5db', 
                fontSize: '14px', 
                fontWeight: '500',
                marginBottom: '8px' 
              }}>
                Ticket LECOM
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: '#f9fafb',
                fontSize: '14px'
              }}>
                {card.lecom_ticket}
              </div>
            </div>
          )}

          {/* Nota sobre edição */}
          <div style={{
            padding: '12px',
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <p style={{ 
              color: '#9ca3af', 
              fontSize: '14px', 
              margin: 0 
            }}>
              📝 Funcionalidade de edição será implementada em breve
            </p>
          </div>

          {/* Botão Fechar */}
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4b5563',
              color: '#f9fafb',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}