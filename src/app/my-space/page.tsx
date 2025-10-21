'use client'

import { useState, useEffect } from 'react'
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  User,
  Filter,
  Plus,
  ArrowRight
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
  status: string
  boardName: string
}

export default function MySpacePage() {
  const [myCards, setMyCards] = useState<Card[]>([])
  const [delegatedCards, setDelegatedCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'my-tasks' | 'delegated'>('my-tasks')
  const [filter, setFilter] = useState<'all' | 'overdue' | 'today' | 'week'>('all')

  // Dados mockados
  useEffect(() => {
    setTimeout(() => {
      const mockMyCards: Card[] = [
        {
          id: '1',
          title: 'Configurar novo computador',
          description: 'Instalar sistema operacional e programas básicos',
          priority: 'MEDIUM',
          urgency: 'NOT_URGENT',
          highImpact: false,
          isProject: false,
          creator: { id: '1', name: 'Luciano Filho', email: 'luciano.filho@unimed.com' },
          endDate: '2024-11-01',
          status: 'Backlog',
          boardName: 'Service Desk Operadora'
        },
        {
          id: '2',
          title: 'Problema crítico no servidor de email',
          description: 'Usuários não conseguem enviar emails',
          priority: 'HIGH',
          urgency: 'URGENT',
          highImpact: true,
          isProject: false,
          creator: { id: '2', name: 'Edwa Favre', email: 'edwa.favre@hospital.com' },
          endDate: '2024-10-22',
          lecomTicket: 'LECOM-12345',
          status: 'Em Andamento',
          boardName: 'Service Desk Operadora'
        }
      ]

      const mockDelegatedCards: Card[] = [
        {
          id: '3',
          title: 'Backup do servidor principal',
          description: 'Backup semanal realizado com sucesso',
          priority: 'LOW',
          urgency: 'NOT_URGENT',
          highImpact: false,
          isProject: false,
          assignee: { id: '2', name: 'Edwa Favre', email: 'edwa.favre@hospital.com' },
          creator: { id: '1', name: 'Luciano Filho', email: 'luciano.filho@unimed.com' },
          status: 'Concluído',
          boardName: 'Service Desk Operadora'
        }
      ]

      setMyCards(mockMyCards)
      setDelegatedCards(mockDelegatedCards)
      setLoading(false)
    }, 1000)
  }, [])

  const filterCards = (cards: Card[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    switch (filter) {
      case 'overdue':
        return cards.filter(card => card.endDate && isOverdue(card.endDate))
      case 'today':
        return cards.filter(card => {
          if (!card.endDate) return false
          const cardDate = new Date(card.endDate)
          return cardDate >= today && cardDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
        })
      case 'week':
        return cards.filter(card => {
          if (!card.endDate) return false
          const cardDate = new Date(card.endDate)
          return cardDate >= today && cardDate <= nextWeek
        })
      default:
        return cards
    }
  }

  const CardItem = ({ card }: { card: Card }) => {
    const priorityClass = getCardPriorityClass(card.priority, card.urgency, card.highImpact)
    const overdue = card.endDate ? isOverdue(card.endDate) : false

    return (
      <div className={cn(
        'bg-dark-800 border border-dark-700 rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer',
        priorityClass
      )}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-medium text-dark-50 mb-1">{card.title}</h3>
            <p className="text-dark-400 text-sm line-clamp-2">{card.description}</p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <span className={cn(
              'text-xs px-2 py-1 rounded-full',
              card.status === 'Concluído' ? 'bg-green-500/10 text-green-500' :
              card.status === 'Em Andamento' ? 'bg-primary-500/10 text-primary-500' :
              'bg-dark-600 text-dark-300'
            )}>
              {card.status}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-dark-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>{card.boardName}</span>
            </span>
            
            {card.endDate && (
              <span className={cn(
                "flex items-center space-x-1",
                overdue ? "text-accent-red" : ""
              )}>
                <Calendar className="w-3 h-3" />
                <span>{formatDate(card.endDate)}</span>
              </span>
            )}
          </div>

          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {overdue && (
          <div className="mt-2 flex items-center space-x-1 text-accent-red text-xs">
            <AlertTriangle className="w-3 h-3" />
            <span>Vencido</span>
          </div>
        )}
      </div>
    )
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color 
  }: { 
    title: string
    value: number
    icon: any
    color: string
  }) => (
    <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-dark-400 text-sm">{title}</p>
          {loading ? (
            <div className="animate-pulse bg-dark-600 h-6 w-12 rounded mt-1"></div>
          ) : (
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          )}
        </div>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  )

  const currentCards = activeTab === 'my-tasks' ? myCards : delegatedCards
  const filteredCards = filterCards(currentCards)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-50">Meu Espaço</h1>
          <p className="text-dark-400 mt-1">
            Suas tarefas e delegações em um só lugar
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Novo Card
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Minhas Tarefas"
          value={myCards.length}
          icon={Clock}
          color="text-primary-500"
        />
        <StatCard
          title="Delegadas"
          value={delegatedCards.length}
          icon={User}
          color="text-secondary-500"
        />
        <StatCard
          title="Vencidas"
          value={myCards.filter(card => card.endDate && isOverdue(card.endDate)).length}
          icon={AlertTriangle}
          color="text-accent-red"
        />
        <StatCard
          title="Concluídas"
          value={[...myCards, ...delegatedCards].filter(card => card.status === 'Concluído').length}
          icon={CheckCircle}
          color="text-green-500"
        />
      </div>

      {/* Tabs and Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-dark-800 border border-dark-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('my-tasks')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === 'my-tasks'
                ? 'bg-primary-500 text-white'
                : 'text-dark-400 hover:text-dark-200'
            )}
          >
            Minhas Pendências ({myCards.length})
          </button>
          <button
            onClick={() => setActiveTab('delegated')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === 'delegated'
                ? 'bg-primary-500 text-white'
                : 'text-dark-400 hover:text-dark-200'
            )}
          >
            Pendências Delegadas ({delegatedCards.length})
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="input-field"
          >
            <option value="all">Todas</option>
            <option value="overdue">Vencidas</option>
            <option value="today">Hoje</option>
            <option value="week">Esta Semana</option>
          </select>
          <button className="btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-dark-800 border border-dark-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="h-5 bg-dark-600 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-dark-600 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-dark-600 rounded w-20"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-4 bg-dark-600 rounded w-24"></div>
                  <div className="h-4 bg-dark-600 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))
        ) : filteredCards.length > 0 ? (
          filteredCards.map(card => (
            <CardItem key={card.id} card={card} />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-dark-400" />
            </div>
            <h3 className="text-lg font-medium text-dark-300 mb-2">
              Nenhuma tarefa encontrada
            </h3>
            <p className="text-dark-500 mb-4">
              {filter === 'all' 
                ? 'Você não tem tarefas no momento.'
                : 'Nenhuma tarefa corresponde aos filtros selecionados.'
              }
            </p>
            <button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Criar Nova Tarefa
            </button>
          </div>
        )}
      </div>
    </div>
  )
}