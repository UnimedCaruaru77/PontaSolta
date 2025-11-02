'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { Plus, Filter, Search } from 'lucide-react'
import KanbanColumn from '@/components/KanbanColumn'
import KanbanCard from '@/components/KanbanCard'
import CardModal from '@/components/CardModal'
import CreateCardModal from '@/components/CreateCardModal'
import AdvancedFiltersModal from '@/components/AdvancedFiltersModal'
import { useAuth } from '@/hooks/useAuth'

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
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [createColumnId, setCreateColumnId] = useState('')
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showFiltersModal, setShowFiltersModal] = useState(false)
    const [filters, setFilters] = useState<any>({})
    const hasActiveFilters = false

    const fetchBoards = async () => {
        try {
            setLoading(true)
            const url = teamId ? `/api/boards?teamId=${teamId}` : '/api/boards'
            const response = await fetch(url)
            if (!response.ok) {
                throw new Error('Erro ao carregar boards')
            }
            const data = await response.json()
            
            if (data.boards && data.boards.length > 0) {
                setBoards(data.boards)
                if (!selectedBoard) {
                    setSelectedBoard(data.boards[0].id)
                }
            } else {
                // Fallback para dados mockados se não houver boards
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
            }
        } catch (error) {
            console.error('Erro ao carregar boards:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBoards()
    }, [teamId])

    const currentBoard = boards.find(board => board.id === selectedBoard)

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        const card = currentBoard?.columns
            .flatMap(col => col.cards)
            .find(card => card.id === active.id)
        setActiveCard(card || null)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        setActiveCard(null)

        if (!over) return

        const activeCard = currentBoard?.columns
            .flatMap(col => col.cards)
            .find(card => card.id === active.id)

        if (!activeCard) return

        const overColumnId = over.id as string
        const sourceColumnId = activeCard.columnId

        if (sourceColumnId === overColumnId) return

        // Atualizar posição do card
        setBoards(prevBoards => 
            prevBoards.map(board => 
                board.id === selectedBoard ? {
                    ...board,
                    columns: board.columns.map(column => ({
                        ...column,
                        cards: column.id === sourceColumnId 
                            ? column.cards.filter(card => card.id !== activeCard.id)
                            : column.id === overColumnId
                            ? [...column.cards, { ...activeCard, columnId: overColumnId }]
                            : column.cards
                    }))
                } : board
            )
        )

        // Aqui você pode fazer a chamada para a API para persistir a mudança
        // updateCardPosition(activeCard.id, overColumnId)
    }

    const handleCardClick = (card: Card) => {
        setSelectedCard(card)
        setIsCardModalOpen(true)
    }

    const handleNewCard = (columnId: string) => {
        setCreateColumnId(columnId)
        setShowCreateModal(true)
    }

    const handleCardCreated = (newCard: Card) => {
        // Adicionar o novo card ao estado local
        setBoards(prevBoards => 
            prevBoards.map(board => 
                board.id === selectedBoard ? {
                    ...board,
                    columns: board.columns.map(column => 
                        column.id === newCard.columnId 
                            ? { ...column, cards: [...column.cards, newCard] }
                            : column
                    )
                } : board
            )
        )
    }

    const handleFiltersClick = () => {
        setShowFiltersModal(true)
    }

    // Filtrar cards baseado na busca
    const getFilteredCards = (cards: Card[]) => {
        return cards.filter(card => {
            // Filtro de busca
            if (searchTerm && !card.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !card.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false
            }
            return true
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-dark-900">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold text-dark-50">
                        {currentBoard?.name || 'Kanban'}
                    </h1>
                    {user && (
                        <span className="text-sm text-dark-400">
                            Bem-vindo, {user.name}
                        </span>
                    )}
                </div>

                <div className="flex items-center space-x-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                        <input
                            type="text"
                            placeholder="Buscar cards..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-dark-200 placeholder-dark-500 focus:outline-none focus:border-primary-500"
                        />
                    </div>

                    {/* Filters */}
                    <button
                        onClick={handleFiltersClick}
                        className={`btn-secondary ${hasActiveFilters ? 'bg-primary-500 text-white' : ''}`}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filtros
                    </button>

                    {/* New Card */}
                    <button
                        onClick={() => handleNewCard('backlog')}
                        className="btn-primary"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Demanda
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto p-6">
                <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div className="flex space-x-6 h-full">
                        {currentBoard?.columns.map((column) => (
                            <KanbanColumn
                                key={column.id}
                                column={{
                                    ...column,
                                    cards: getFilteredCards(column.cards)
                                }}
                                onCardClick={handleCardClick}
                                onNewCard={() => handleNewCard(column.id)}
                            />
                        ))}
                    </div>

                    <DragOverlay>
                        {activeCard ? <KanbanCard card={activeCard} /> : null}
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
                    onSave={async (updatedCard) => {
                        try {
                            // Atualizar o card no estado local imediatamente
                            setBoards(prevBoards => 
                                prevBoards.map(board => ({
                                    ...board,
                                    columns: board.columns.map(column => ({
                                        ...column,
                                        cards: column.cards.map(card => 
                                            card.id === updatedCard.id ? updatedCard : card
                                        )
                                    }))
                                }))
                            )
                            
                            console.log('Card atualizado no estado local:', updatedCard)
                            
                        } catch (error) {
                            console.error('Erro ao atualizar card no estado:', error)
                            // Em caso de erro, recarregar dados do servidor
                            await fetchBoards()
                        }
                        
                        setIsCardModalOpen(false)
                        setSelectedCard(null)
                    }}
                />
            )}

            {/* Create Card Modal */}
            {showCreateModal && (
                <CreateCardModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    columnId={createColumnId}
                    boardId={selectedBoard}
                    onCardCreated={handleCardCreated}
                />
            )}

            {/* Advanced Filters Modal */}
            {showFiltersModal && (
                <AdvancedFiltersModal
                    isOpen={showFiltersModal}
                    onClose={() => setShowFiltersModal(false)}
                    onApplyFilters={(newFilters) => {
                        // Aplicar filtros
                        console.log('Aplicar filtros:', newFilters)
                        setFilters(newFilters)
                        setShowFiltersModal(false)
                    }}
                />
            )}
        </div>
    )
}

export default function KanbanPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500"></div>
            </div>
        }>
            <KanbanContent />
        </Suspense>
    )
}