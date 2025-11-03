'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, MoreHorizontal, Circle, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import KanbanCard from './KanbanCard'

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

interface Column {
  id: string
  name: string
  position: number
  cards: Card[]
}

interface KanbanColumnProps {
  column: Column
  onCardClick: (card: Card) => void
  onNewCard: (columnId: string) => void
}

export default function KanbanColumn({ column, onCardClick, onNewCard }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  const cardIds = column.cards.map(card => card.id)

  const getColumnIcon = () => {
    switch (column.id) {
      case 'backlog':
        return <Circle className="w-4 h-4 text-dark-400" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-accent-orange" />
      case 'review':
        return <AlertCircle className="w-4 h-4 text-secondary-500" />
      case 'done':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Circle className="w-4 h-4 text-dark-400" />
    }
  }

  const getColumnColor = () => {
    switch (column.id) {
      case 'backlog':
        return 'border-t-dark-500'
      case 'in_progress':
        return 'border-t-accent-orange'
      case 'review':
        return 'border-t-secondary-500'
      case 'done':
        return 'border-t-green-500'
      default:
        return 'border-t-dark-500'
    }
  }

  const getStats = () => {
    const total = column.cards.length
    const highPriority = column.cards.filter(card => card.priority === 'HIGH').length
    const overdue = column.cards.filter(card => 
      card.endDate && new Date(card.endDate) < new Date()
    ).length
    
    return { total, highPriority, overdue }
  }

  const stats = getStats()

  return (
    <div className={`flex flex-col w-80 bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-xl transition-all duration-200 ${
      isOver ? 'ring-2 ring-primary-500/50 border-primary-500/50 bg-primary-500/5' : ''
    }`}>
      {/* Column Header */}
      <div className={`border-t-4 ${getColumnColor()} rounded-t-xl`}>
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="flex items-center space-x-3">
            {getColumnIcon()}
            <div>
              <h3 className="font-semibold text-dark-50 text-sm">{column.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="bg-dark-700/50 text-dark-300 text-xs px-2 py-0.5 rounded-full font-medium">
                  {stats.total} cards
                </span>
                {stats.highPriority > 0 && (
                  <span className="bg-accent-red/10 text-accent-red text-xs px-2 py-0.5 rounded-full font-medium border border-accent-red/20">
                    {stats.highPriority} alta
                  </span>
                )}
                {stats.overdue > 0 && (
                  <span className="bg-accent-orange/10 text-accent-orange text-xs px-2 py-0.5 rounded-full font-medium border border-accent-orange/20">
                    {stats.overdue} vencido
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onNewCard(column.id)}
              className="p-2 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-primary-400 transition-all duration-200 hover:scale-105"
              title="Adicionar card"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-dark-200 transition-all duration-200">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-4 space-y-3 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto transition-all duration-200 ${
          isOver ? 'bg-primary-500/5' : ''
        }`}
        data-column-id={column.id}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {column.cards.map(card => (
            <KanbanCard
              key={card.id}
              card={card}
              onClick={() => onCardClick(card)}
            />
          ))}
        </SortableContext>
        
        {/* Drop Zone */}
        <div className="min-h-[60px] flex items-center justify-center">
          {column.cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-dark-500 w-full">
              <div className="w-16 h-16 bg-dark-700/30 border-2 border-dashed border-dark-600 rounded-xl flex items-center justify-center mb-4 transition-all duration-200 hover:border-primary-500/50 hover:bg-primary-500/5">
                <Plus className="w-8 h-8 text-dark-500" />
              </div>
              <p className="text-sm font-medium mb-1">Coluna vazia</p>
              <p className="text-xs text-dark-600 mb-3 text-center">
                Arraste cards aqui ou crie um novo
              </p>
              <button
                onClick={() => onNewCard(column.id)}
                className="bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 hover:text-primary-300 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 border border-primary-500/20 hover:border-primary-500/40"
              >
                Criar primeiro card
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-200 group">
              <button
                onClick={() => onNewCard(column.id)}
                className="bg-dark-700/30 hover:bg-primary-500/10 text-dark-500 hover:text-primary-400 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 border border-dashed border-dark-600 hover:border-primary-500/50 flex items-center space-x-2 group-hover:scale-105"
              >
                <Plus className="w-3 h-3" />
                <span>Adicionar card</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Column Footer com estatísticas */}
      {column.cards.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-dark-700/30 rounded-lg p-3 border border-dark-600/50">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <span className="text-dark-400">
                  Total: <span className="text-dark-200 font-medium">{stats.total}</span>
                </span>
                {stats.highPriority > 0 && (
                  <span className="text-accent-red">
                    Alta prioridade: <span className="font-medium">{stats.highPriority}</span>
                  </span>
                )}
              </div>
              {stats.overdue > 0 && (
                <span className="text-accent-orange font-medium">
                  {stats.overdue} vencido{stats.overdue > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}