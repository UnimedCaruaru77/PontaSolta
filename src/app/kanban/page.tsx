'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { Plus, Filter, Search } from 'lucide-react'
import KanbanColumn from '@/components/KanbanColumn'
import KanbanCard from '@/components/KanbanCard'
import CardModal from '@/components/CardModal'
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
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

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
        const overId = over.id as string

        // Mapear IDs das colunas para status
        const statusMap: { [key: string]: string } = {
            'backlog': 'BACKLOG',
            'in_progress': 'IN_PROGRESS',
            'review': 'REVIEW',
            'done': 'DONE'
        }

        const newStatus = statusMap[overId]
        if (!newStatus) return

        try {
            // Atualizar no backend
            const response = await fetch(`/api/cards/${cardId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus
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
                    const targetColumnIndex = updatedColumns.findIndex(col => col.id === overId)
                    if (targetColumnIndex !== -1) {
                        const card = findCard(cardId)
                        if (card) {
                            updatedColumns[targetColumnIndex].cards.push({
                                ...card,
                                columnId: overId
                            })
                        }
                    }

                    return {
                        ...board,
                        columns: updatedColumns
                    }
                })
            )

            console.log(`Card ${cardId} movido para ${newStatus}`)
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

    const handleCreateCard = async (columnId: string) => {
        const statusMap: { [key: string]: string } = {
            'backlog': 'BACKLOG',
            'in_progress': 'IN_PROGRESS',
            'review': 'REVIEW',
            'done': 'DONE'
        }

        const status = statusMap[columnId]
        if (!status) return

        const title = prompt('Digite o título do card:')
        if (!title) return

        try {
            const response = await fetch('/api/cards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    boardId: selectedBoard,
                    creatorId: user?.id || '1',
                    status,
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
        cards: column.cards.filter(card =>
            card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            card.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
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
                    <button className="btn-secondary">
                        <Filter className="w-4 h-4 mr-2" />
                        Filtros
                    </button>
                    <button className="btn-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Card
                    </button>
                </div>
            </div>

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