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
  CheckCircle2,
  Flag,
  Zap,
  Target,
  GripVertical,
  MessageCircle,
  Paperclip
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

  const handleClick = (e: React.MouseEvent) => {
    // Prevenir click durante drag
    if (isSortableDragging) return
    
    e.stopPropagation()
    onClick()
  }

  const getPriorityColor = () => {
    switch (card.priority) {
      case 'HIGH': return 'border-l-accent-red bg-gradient-to-r from-accent-red/5 to-transparent'
      case 'MEDIUM': return 'border-l-accent-orange bg-gradient-to-r from-accent-orange/5 to-transparent'
      case 'LOW': return 'border-l-green-500 bg-gradient-to-r from-green-500/5 to-transparent'
      default: return 'border-l-dark-600'
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'group select-none relative transition-all duration-200 ease-out',
        'bg-dark-800 border border-dark-700 rounded-xl shadow-sm hover:shadow-lg',
        'border-l-4', getPriorityColor(),
        isDragging || isSortableDragging ? 'opacity-60 rotate-2 scale-105 shadow-2xl z-50' : '',
        overdue ? 'ring-2 ring-accent-red/30 border-accent-red/50' : '',
        'hover:border-dark-600 hover:-translate-y-1'
      )}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        className="absolute top-3 right-3 p-1 rounded-md cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-dark-700"
        title="Arrastar card"
      >
        <GripVertical className="w-4 h-4 text-dark-400" />
      </div>

      {/* Card Content */}
      <div
        onClick={handleClick}
        className="cursor-pointer p-4 pr-10"
      >
        {/* Header com badges */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {card.isProject && (
                <div className="flex items-center space-x-1 bg-secondary-500/10 text-secondary-400 px-2 py-1 rounded-md text-xs font-medium">
                  <FolderKanban className="w-3 h-3" />
                  <span>Projeto</span>
                </div>
              )}
              {card.lecomTicket && (
                <div className="flex items-center space-x-1 bg-primary-500/10 text-primary-400 px-2 py-1 rounded-md text-xs font-medium">
                  <ExternalLink className="w-3 h-3" />
                  <span>{card.lecomTicket}</span>
                </div>
              )}
            </div>
            
            <h4 className="font-semibold text-dark-50 text-sm leading-tight mb-1 group-hover:text-primary-400 transition-colors">
              {card.title}
            </h4>
          </div>
        </div>

        {/* Description */}
        {card.description && (
          <p className="text-dark-400 text-xs mb-4 line-clamp-2 leading-relaxed">
            {card.description}
          </p>
        )}

        {/* Priority & Status Indicators */}
        <div className="flex items-center flex-wrap gap-1 mb-4">
          {card.priority === 'HIGH' && (
            <div className="flex items-center space-x-1 bg-accent-red/10 text-accent-red px-2 py-1 rounded-full text-xs font-medium border border-accent-red/20">
              <Flag className="w-3 h-3" />
              <span>Alta</span>
            </div>
          )}
          {card.urgency === 'URGENT' && (
            <div className="flex items-center space-x-1 bg-accent-orange/10 text-accent-orange px-2 py-1 rounded-full text-xs font-medium border border-accent-orange/20">
              <Zap className="w-3 h-3" />
              <span>Urgente</span>
            </div>
          )}
          {card.highImpact && (
            <div className="flex items-center space-x-1 bg-accent-yellow/10 text-accent-yellow px-2 py-1 rounded-full text-xs font-medium border border-accent-yellow/20">
              <Target className="w-3 h-3" />
              <span>Alto Impacto</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Assignee */}
          <div className="flex items-center space-x-2">
            {card.assignee ? (
              <div className="flex items-center space-x-2" title={card.assignee.name}>
                <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {getInitials(card.assignee.name)}
                </div>
                <span className="text-xs text-dark-300 font-medium">
                  {card.assignee.name.split(' ')[0]}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-dark-500">
                <div className="w-6 h-6 border-2 border-dashed border-dark-600 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3" />
                </div>
                <span className="text-xs">Não atribuído</span>
              </div>
            )}
          </div>
          
          {/* Date and Actions */}
          <div className="flex items-center space-x-2">
            {/* Mock indicators for future features */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <MessageCircle className="w-3 h-3 text-dark-500" title="0 comentários" />
              <Paperclip className="w-3 h-3 text-dark-500" title="0 anexos" />
            </div>
            
            {card.endDate && (
              <div className={cn(
                "flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium",
                overdue 
                  ? "bg-accent-red/10 text-accent-red border border-accent-red/20" 
                  : "bg-dark-700 text-dark-300"
              )} title={`Prazo: ${formatDate(card.endDate)}`}>
                <Calendar className="w-3 h-3" />
                <span>{formatDate(card.endDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Overdue Alert */}
        {overdue && (
          <div className="mt-3 flex items-center space-x-2 bg-accent-red/10 border border-accent-red/20 rounded-lg p-2">
            <AlertTriangle className="w-4 h-4 text-accent-red" />
            <span className="text-xs text-accent-red font-medium">Prazo vencido</span>
          </div>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl pointer-events-none" />
    </div>
  )
}