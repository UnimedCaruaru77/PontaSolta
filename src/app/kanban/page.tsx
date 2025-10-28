'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { Plus, Filter, Search } from 'lucide-react'
import KanbanColumn from '@/components/KanbanColumn'
import KanbanCard from '@/components/KanbanCard'
import CardModal from '@/components/CardModal'
import AdvancedFiltersModal from '@/components/AdvancedFiltersModal'
import { useAuth } from '@/hooks/useAuth'
import { useFilters } from '@/hooks/useFilters'

interface FilterOptions {
  dateRange: {
    startDate: string
    endDate: string
    preset: 'custom' | 'today' | 'week' | 'month' | 'quarter' | 'year'
  }
  status: string[]
  priority: string[]
  urgency: string[]
  teams: string[]
  assignees: string[]
  creators: string[]
  tags: string[]
  hasDeadline: boolean | null
  isOverdue: boolean | null
  isProject: boolean | null
}

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

interface Board {
    id: string
    name: string
    columns: Column[]
}

function KanbanContent() {
    const { user } = useAuth()
    const searchParams = useSearchParams()
    const teamId = searchParams.get('team')
    
    const [boards, setBoards] = useState<Board[]>([])
    const [selectedBoard, setSelectedBoard] = useState<string>('')
    const [activeCard, setActiveCard] = useState<Card | null>(null)
    const [selectedCard, setSelectedCard] = useState<Card | null>(null)
    const [isCardModalOpen, setIsCardModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showFiltersModal, setShowFiltersModal] = useState(false)
    const { filters, hasActiveFilters } = useFilters({ data: [] })

    useEffect(() => {
        const fetchBoards = async () => {
            try {
                const url = teamId ? `/api/boards?teamId=${teamId}` : '/api/boards'
                const response = await fetch(url)
                if (!response.ok) {
                    throw new Error('Erro ao carregar boards')
                }
                const data = await response.json()
                
                if (data.boards && data.boards.length > 0) {
                    setBoards(data.boards)
                    setSelectedBoard(data.boards[0].id)
                } else {
                    // Fallback para dados mockados se não houver boards
                    const mockBoards: Board[] = [
                        {
                            id: '1',
                            name: 'Service Desk Operadora',
                            columns: [
                                {
                                    id: 'backlog',
                                    name: 'Backlog',
                                    position: 0,
                                    cards: []
                                },
                                {
                                    id: 'in_progress',
                                    name: 'Em Andamento',
                                    position: 1,
                                    cards: []
                                },
                                {
                                    id: 'review',
                                    name: 'Em Revisão',
                                    position: 2,
                                    cards: []
                                },
                                {
                                    id: 'done',
                                    name: 'Concluído',
                                    position: 3,
                                    cards: []
                                }
                            ]
                        }
                    ]
                    setBoards(mockBoards)
                    setSelectedBoard(mockBoards[0].id)
                }
            } catch (error) {
                console.error('Erro ao carregar boards:', error)
                // Fallback para dados mockados em caso de erro
                const mockBoards: Board[] = [
                    {
                        id: '1',
                        name: 'Service Desk Operadora (Offline)',
                        columns: [
                            {
                                id: 'backlog',
                                name: 'Backlog',
                                position: 0,
                                cards: [
                                    {
                                        id: 'card1',
                                        title: 'Configurar novo computador',
                                        description: 'Instalar sistema operacional e programas básicos',
                                        priority: 'MEDIUM',
                                        urgency: 'NOT_URGENT',
                                        highImpact: false,
                                        isProject: false,
                                        assignee: { id: '2', name: 'Edwa Favre', email: 'edwa.favre@hospital.com' },
                                        creator: { id: '1', name: 'Luciano Filho', email: 'luciano.filho@unimed.com' },
                                        endDate: '2024-11-01',
                                        position: 0,
                                        columnId: 'backlog'
                                    }
                                ]
                            },
                            {
                                id: 'in_progress',
                                name: 'Em Andamento',
                                position: 1,
                                cards: []
                            },
                            {
                                id: 'review',
                                name: 'Em Revisão',
                                position: 2,
                                cards: []
                            },
                            {
                                id: 'done',
                                name: 'Concluído',
                                position: 3,
                                cards: []
                            }
                        ]
                    }
                ]
                setBoards(mockBoards)
                setSelectedBoard(mockBoards[0].id)
            } finally {
                setLoading(false)
            }
        }

        fetchBoards()
    }, [teamId])

    const currentBoard = boards.find(board => board.id === selectedBoard)

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        const card = findCard(active.id as string)
        setActiveCard(card)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveCard(null)

        if (!over) return

        const cardId = active.id as string
        let targetColumnId = over.id as string

        console.log('Drag end:', { cardId, targetColumnId })

        // Se o drop foi sobre um card, encontrar a coluna desse card
        let targetColumn = currentBoard?.columns.find(col => col.id === targetColumnId)
        
        if (!targetColumn) {
            // Se não encontrou a coluna diretamente, pode ser que o drop foi sobre um card
            // Vamos procurar em qual coluna está o card de destino
            for (const board of boards) {
                for (const column of board.columns) {
                    if (column.cards.some(card => card.id === targetColumnId)) {
                        targetColumnId = column.id
                        targetColumn = column
                        break
                    }
                }
                if (targetColumn) break
            }
        }

        if (!targetColumn) {
            console.error('Coluna de destino não encontrada:', targetColumnId)
            return
        }

        // Verificar se o card já está na coluna de destino
        const sourceCard = findCard(cardId)
        if (sourceCard && sourceCard.columnId === targetColumnId) {
            console.log('Card já está na coluna de destino')
            return
        }

        try {
            // Atualizar no backend - usar column_id em vez de status
            const response = await fetch(`/api/cards/${cardId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    column_id: targetColumnId
                })
            })

            if (!response.ok) {
                throw new Error('Erro ao mover card')
            }

            // Atualizar estado local
            setBoards(prevBoards => 
                prevBoards.map(board => {
                    if (board.id !== selectedBoard) return board

                    const updatedColumns = board.columns.map(column => ({
                        ...column,
                        cards: column.cards.filter(card => card.id !== cardId)
                    }))

                    // Encontrar a coluna de destino e adicionar o card
                    const targetColumnIndex = updatedColumns.findIndex(col => col.id === targetColumnId)
                    if (targetColumnIndex !== -1) {
                        const card = findCard(cardId)
                        if (card) {
                            updatedColumns[targetColumnIndex].cards.push({
                                ...card,
                                columnId: targetColumnId
                            })
                        }
                    }

                    return {
                        ...board,
                        columns: updatedColumns
                    }
                })
            )

            console.log(`Card ${cardId} movido para coluna ${targetColumnId}`)
        } catch (error) {
            console.error('Erro ao mover card:', error)
            // Aqui você poderia mostrar uma notificação de erro
        }
    }

    const findCard = (cardId: string): Card | null => {
        for (const board of boards) {
            for (const column of board.columns) {
                const card = column.cards.find(c => c.id === cardId)
                if (card) return card
            }
        }
        return null
    }

    const handleCardClick = (card: Card) => {
        setSelectedCard(card)
        setIsCardModalOpen(true)
    }

    const handleFilters = () => {
        setShowFiltersModal(true)
    }

    const handleApplyFilters = (newFilters: FilterOptions) => {
        // Os filtros são aplicados automaticamente através do useFilters
    }

    const handleCreateCard = async (columnId: string) => {
        const title = prompt('Digite o título do card:')
        if (!title) return

        try {
            console.log('Creating card with:', {
                title,
                boardId: selectedBoard,
                columnId,
                creatorId: user?.id || 'user_1'
            })

            const response = await fetch('/api/cards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    boardId: selectedBoard,
                    columnId,
                    creatorId: user?.id || 'user_1',
                    position: 0
                })
            })

            if (!response.ok) {
                throw new Error('Erro ao criar card')
            }

            const data = await response.json()
            const newCard = {
                ...data.card,
                columnId,
                assignee: data.card.assignee || undefined,
                creator: data.card.creator
            }

            // Atualizar estado local
            setBoards(prevBoards => 
                prevBoards.map(board => {
                    if (board.id !== selectedBoard) return board

                    return {
                        ...board,
                        columns: board.columns.map(column => {
                            if (column.id === columnId) {
                                return {
                                    ...column,
                                    cards: [newCard, ...column.cards]
                                }
                            }
                            return column
                        })
                    }
                })
            )

            console.log('Card criado com sucesso:', newCard)
        } catch (error) {
            console.error('Erro ao criar card:', error)
            alert('Erro ao criar card. Tente novamente.')
        }
    }

    const filteredColumns = currentBoard?.columns.map(column => ({
        ...column,
        cards: column.cards.filter(card => {
            // Filtro por busca de texto
            const matchesSearch = !searchTerm || 
                card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                card.description?.toLowerCase().includes(searchTerm.toLowerCase())

            // Filtros avançados
            const matchesPriority = !filters.priority?.length || 
                filters.priority.includes(card.priority)
            
            const matchesUrgency = !filters.urgency?.length || 
                filters.urgency.includes(card.urgency)
            
            const matchesAssignee = !filters.assignees?.length || 
                (card.assignee && filters.assignees.includes(card.assignee.id))
            
            const matchesCreator = !filters.creators?.length || 
                filters.creators.includes(card.creator.id)

            return matchesSearch && matchesPriority && matchesUrgency && 
                   matchesAssignee && matchesCreator
        })
    })) || []

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-dark-700 rounded w-1/4"></div>
                    <div className="grid grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-3">
                                <div className="h-6 bg-dark-700 rounded"></div>
                                <div className="space-y-2">
                                    <div className="h-24 bg-dark-700 rounded"></div>
                                    <div className="h-24 bg-dark-700 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <h1 className="text-3xl font-bold text-dark-50">Kanban</h1>
                    <select
                        value={selectedBoard}
                        onChange={(e) => setSelectedBoard(e.target.value)}
                        className="input-field"
                    >
                        {boards.map(board => (
                            <option key={board.id} value={board.id}>
                                {board.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar cards..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10 w-64"
                        />
                    </div>
                    <button 
                        onClick={handleFilters} 
                        className={`btn-secondary ${hasActiveFilters ? 'bg-primary-500/10 border-primary-500/20 text-primary-400' : ''}`}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filtros
                        {hasActiveFilters && (
                            <span className="ml-2 bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                                Ativo
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => {
                            const firstColumn = currentBoard?.columns[0]
                            if (firstColumn) {
                                handleCreateCard(firstColumn.id)
                            }
                        }}
                        className="btn-primary"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Card
                    </button>
                </div>
            </div>

            {/* Resumo dos Filtros */}
            {hasActiveFilters && (
                <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-primary-500" />
                            <span className="text-sm text-primary-400">Filtros ativos:</span>
                            <span className="text-sm text-dark-300">{hasActiveFilters ? 'Filtros aplicados' : 'Nenhum filtro'}</span>
                        </div>
                        <button
                            onClick={() => setShowFiltersModal(true)}
                            className="text-xs text-primary-400 hover:text-primary-300"
                        >
                            Editar
                        </button>
                    </div>
                </div>
            )}

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto">
                <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div className="flex space-x-6 h-full min-w-max">
                        {filteredColumns.map(column => (
                            <KanbanColumn
                                key={column.id}
                                column={column}
                                onCardClick={handleCardClick}
                                onCreateCard={handleCreateCard}
                            />
                        ))}
                    </div>

                    <DragOverlay>
                        {activeCard ? (
                            <KanbanCard card={activeCard} onClick={() => { }} isDragging />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Card Modal */}
            {selectedCard && (
                <CardModal
                    card={selectedCard}
                    isOpen={isCardModalOpen}
                    onClose={() => {
                        setIsCardModalOpen(false)
                        setSelectedCard(null)
                    }}
                    onSave={(updatedCard) => {
                        // Implementar salvamento
                        console.log('Salvar card:', updatedCard)
                        setIsCardModalOpen(false)
                        setSelectedCard(null)
                    }}
                />
            )}

            {/* Advanced Filters Modal */}
            <AdvancedFiltersModal
                isOpen={showFiltersModal}
                onClose={() => setShowFiltersModal(false)}
                onApplyFilters={handleApplyFilters}
                context="kanban"
                currentFilters={filters}
            />
        </div>
    )
}

export default function KanbanPage() {
    return (
        <Suspense fallback={
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-dark-700 rounded w-1/4"></div>
                    <div className="grid grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-3">
                                <div className="h-6 bg-dark-700 rounded"></div>
                                <div className="space-y-2">
                                    <div className="h-24 bg-dark-700 rounded"></div>
                                    <div className="h-24 bg-dark-700 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        }>
            <KanbanContent />
        </Suspense>
    )
}