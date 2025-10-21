'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  Calendar, 
  User, 
  AlertTriangle, 
  Clock, 
  FolderKanban,
  ExternalLink,
  CheckCircle2
} from 'lucide-react'
import { cn, getCardPriorityClass, formatDate, isOverdue } from '@/lib/utils'

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

interface KanbanCardProps {
  card: Card
  onClick: () => void
  isDragging?: boolean
}

export default function KanbanCard({ card, onClick, isDragging = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityClass = getCardPriorityClass(card.priority, card.urgency, card.highImpact)
  const overdue = card.endDate ? isOverdue(card.endDate) : false

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'card-kanban group cursor-pointer select-none',
        priorityClass,
        isDragging || isSortableDragging ? 'opacity-50 rotate-3 scale-105' : '',
        overdue ? 'border-accent-red' : ''
      )}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-dark-50 text-sm leading-tight flex-1 pr-2">
          {card.title}
        </h4>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {card.isProject && (
            <FolderKanban className="w-4 h-4 text-secondary-500" title="Projeto" />
          )}
          {card.lecomTicket && (
            <ExternalLink className="w-4 h-4 text-primary-500" title={`LECOM: ${card.lecomTicket}`} />
          )}
        </div>
      </div>

      {/* Description */}
      {card.description && (
        <p className="text-dark-400 text-xs mb-3 line-clamp-2">
          {card.description}
        </p>
      )}

      {/* Priority & Urgency Indicators */}
      <div className="flex items-center space-x-2 mb-3">
        {card.priority === 'HIGH' && (
          <span className="bg-accent-red/10 text-accent-red text-xs px-2 py-1 rounded-full border border-accent-red/20">
            Alta Prioridade
          </span>
        )}
        {card.urgency === 'URGENT' && (
          <span className="bg-accent-orange/10 text-accent-orange text-xs px-2 py-1 rounded-full border border-accent-orange/20">
            Urgente
          </span>
        )}
        {card.highImpact && (
          <span className="bg-accent-yellow/10 text-accent-yellow text-xs px-2 py-1 rounded-full border border-accent-yellow/20">
            Alto Impacto
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-dark-400">
        <div className="flex items-center space-x-2">
          {card.assignee && (
            <div className="flex items-center space-x-1" title={card.assignee.name}>
              <User className="w-3 h-3" />
              <span className="truncate max-w-[80px]">
                {card.assignee.name.split(' ')[0]}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {card.endDate && (
            <div className={cn(
              "flex items-center space-x-1",
              overdue ? "text-accent-red" : "text-dark-400"
            )} title={`Prazo: ${formatDate(card.endDate)}`}>
              <Calendar className="w-3 h-3" />
              <span>{formatDate(card.endDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Overdue indicator */}
      {overdue && (
        <div className="mt-2 flex items-center space-x-1 text-accent-red text-xs">
          <AlertTriangle className="w-3 h-3" />
          <span>Vencido</span>
        </div>
      )}
    </div>
  )
}