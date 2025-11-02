'use client'

import { useState } from 'react'

interface SimpleCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCardCreated: (card: any) => void
}

export default function SimpleCreateModal({ 
  isOpen, 
  onClose, 
  onCardCreated 
}: SimpleCreateModalProps) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      alert('Título é obrigatório')
      return
    }

    setLoading(true)
    
    try {
      // Primeiro, vamos buscar um board existente
      const boardsResponse = await fetch('/api/boards')
      const boardsData = await boardsResponse.json()
      
      if (!boardsData.boards || boardsData.boards.length === 0) {
        throw new Error('Nenhum board encontrado')
      }
      
      const board = boardsData.boards[0]
      const column = board.columns && board.columns.length > 0 ? board.columns[0] : null
      
      if (!column) {
        throw new Error('Nenhuma coluna encontrada no board')
      }

      console.log('Usando board:', board.id, 'coluna:', column.id)

      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          description: '',
          priority: 'MEDIUM',
          urgency: 'NOT_URGENT',
          highImpact: false,
          isProject: false,
          assigneeId: null,
          creatorId: 'user_1',
          startDate: null,
          endDate: null,
          lecomTicket: null,
          boardId: board.id,
          columnId: column.id,
          position: 0
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao criar card')
      }

      const data = await response.json()
      
      console.log('Card criado pela API:', data.card)
      
      alert('Card criado com sucesso!')
      onCardCreated(data.card)
      
      setTitle('')
      onClose()

    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao criar card')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

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
        maxWidth: '500px',
        margin: '16px'
      }}>
        <h2 style={{ 
          color: '#f9fafb', 
          fontSize: '20px', 
          fontWeight: '600', 
          marginBottom: '16px' 
        }}>
          Nova Demanda
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              color: '#d1d5db', 
              fontSize: '14px', 
              marginBottom: '8px' 
            }}>
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título da demanda"
              disabled={loading}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: '#f9fafb',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Criando...' : 'Criar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4b5563',
                color: '#d1d5db',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}