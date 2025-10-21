'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, MoreHorizontal } from 'lucide-react'
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
  onCreateCard: (columnId: string) => void
}

export default function KanbanColumn({ column, onCardClick, onCreateCard }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  const cardIds = column.cards.map(card => card.id)

  return (
    <div className="flex flex-col w-80 bg-dark-800 border border-dark-700 rounded-xl">
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-700">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-dark-50">{column.name}</h3>
          <span className="bg-dark-600 text-dark-300 text-xs px-2 py-1 rounded-full">
            {column.cards.length}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onCreateCard(column.id)}
            className="p-1 hover:bg-dark-700 rounded text-dark-400 hover:text-primary-500 transition-colors"
            title="Adicionar card"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-dark-700 rounded text-dark-400 hover:text-dark-200 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className="flex-1 p-4 space-y-3 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto"
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
        
        {column.cards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-dark-500">
            <div className="w-12 h-12 bg-dark-700 rounded-lg flex items-center justify-center mb-3">
              <Plus className="w-6 h-6" />
            </div>
            <p className="text-sm">Nenhum card nesta coluna</p>
            <button
              onClick={() => onCreateCard(column.id)}
              className="text-xs text-primary-500 hover:text-primary-400 mt-1"
            >
              Adicionar primeiro card
            </button>
          </div>
        )}
      </div>
    </div>
  )
}