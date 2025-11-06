'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { Plus, Filter, Search, Download } from 'lucide-react'
import KanbanColumn from '@/components/KanbanColumn'
import KanbanCard from '@/components/KanbanCard'
import SimpleCardModal from '@/components/SimpleCardModal'
import SimpleCreateModal from '@/components/SimpleCreateModal'
import AdvancedFiltersModal from '@/components/AdvancedFiltersModal'
import ExportModal from '@/components/ExportModal'

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
    const teamId = searchParams.get('teamId')
    
    const [boards, setBoards] = useState<Board[]>([])
    const [selectedBoard, setSelectedBoard] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [selectedCard, setSelectedCard] = useState<Card | null>(null)
    const [isCardModalOpen, setIsCardModalOpen] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showFiltersModal, setShowFiltersModal] = useState(false)
    const [showExportModal, setShowExportModal] = useState(false)
    const [createColumnId, setCreateColumnId] = useState<string>('')
    const [activeCard, setActiveCard] = useState<Card | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filters, setFilters] = useState({})
    
    const hasActiveFilters = false

    const fetchBoards = async () => {
        try {
            setLoading(true)
            
            // Dados de teste temporários enquanto a API não funciona
            const mockBoards = [
                {
                    id: 'board-1',
                    name: 'Kanban Service Desk',
                    columns: [
                        {
                            id: 'backlog',
                            name: 'Backlog',
                            position: 0,
                            cards: [
                                {
                                    id: 'card-1',
                                    title: 'Configurar novo computador',
                                    description: 'Instalar sistema operacional e programas básicos para novo funcionário',
                                    priority: 'HIGH',
                                    urgency: 'URGENT',
                                    highImpact: true,
                                    isProject: false,
                                    creator: {
                                        id: '1',
                                        name: 'Usuário Teste',
                                        email: 'teste@exemplo.com'
                                    },
                                    position: 0,
                                    columnId: 'backlog'
                                }
                            ]
                        },
                        {
                            id: 'in_progress',
                            name: 'Em Andamento',
                            position: 1,
                            cards: [
                                {
                                    id: 'card-2',
                                    title: 'Resolver problema de impressora',
                                    description: 'Impressora do setor financeiro não está funcionando. TESTE',
                                    priority: 'MEDIUM',
                                    urgency: 'NOT_URGENT',
                                    highImpact: false,
                                    isProject: false,
                                    creator: {
                                        id: '1',
                                        name: 'Usuário Teste',
                                        email: 'teste@exemplo.com'
                                    },
                                    position: 0,
                                    columnId: 'in_progress'
                                }
                            ]
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
            
            console.log('📊 Usando dados de teste:', mockBoards)
            setBoards(mockBoards)
            if (mockBoards.length > 0 && !selectedBoard) {
                setSelectedBoard(mockBoards[0].id)
                console.log('🎯 Board selecionado:', mockBoards[0].id)
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
    
    console.log('🔍 Debug Kanban:', {
        boards: boards.length,
        selectedBoard,
        currentBoard: currentBoard?.name,
        columns: currentBoard?.columns?.length || 0
    })

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        const card = currentBoard?.columns
            .flatMap(column => column.cards)
            .find(card => card.id === active.id)
        setActiveCard(card || null)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        setActiveCard(null)

        if (!over) return

        const activeCard = currentBoard?.columns
            .flatMap(column => column.cards)
            .find(card => card.id === active.id)

        if (!activeCard) return

        const targetColumnId = over.id as string
        
        if (activeCard.columnId !== targetColumnId) {
            setBoards(prevBoards =>
                prevBoards.map(board =>
                    board.id === selectedBoard ? {
                        ...board,
                        columns: board.columns.map(column => {
                            if (column.id === activeCard.columnId) {
                                return {
                                    ...column,
                                    cards: column.cards.filter(card => card.id !== activeCard.id)
                                }
                            }
                            if (column.id === targetColumnId) {
                                return {
                                    ...column,
                                    cards: [...column.cards, { ...activeCard, columnId: targetColumnId }]
                                }
                            }
                            return column
                        })
                    } : board
                )
            )
        }
    }

    const handleCardClick = (card: Card) => {
        setSelectedCard(card)
        setIsCardModalOpen(true)
    }

    const handleNewCard = (columnId: string) => {
        const newCard: Card = {
            id: 'temp_' + Date.now(),
            title: '',
            description: '',
            priority: 'MEDIUM',
            urgency: 'NOT_URGENT',
            highImpact: false,
            isProject: false,
            creator: {
                id: user?.id || '1',
                name: user?.name || 'Usuário Atual',
                email: user?.email || 'usuario@exemplo.com'
            },
            position: 0,
            columnId: columnId
        }

        setSelectedCard(newCard)
        setIsCardModalOpen(true)
        setCreateColumnId(columnId)
    }

    const handleCardCreated = async (newCard: Card) => {
        console.log('Card criado recebido:', newCard)
        
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

        setTimeout(() => {
            fetchBoards()
        }, 1000)
    }

    const handleFiltersClick = () => {
        setShowFiltersModal(true)
    }

    const handleExportClick = () => {
        setShowExportModal(true)
    }

    const getExportData = () => {
        const allCards = currentBoard?.columns.flatMap(column =>
            column.cards.map(card => ({
                ...card,
                columnName: column.name
            }))
        ) || []
        
        return allCards
    }

    const getFilteredCards = (cards: Card[]) => {
        return cards.filter(card => {
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
        <div className="min-h-screen bg-dark-900">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-dark-900/95 backdrop-blur-sm border-b border-dark-700">
                <div className="flex items-center justify-between p-6">
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
                                className="pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        {/* Filters */}
                        <button
                            onClick={handleFiltersClick}
                            className={'btn-secondary ' + (hasActiveFilters ? 'bg-primary-500 text-white' : '')}
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filtros
                        </button>

                        {/* Export */}
                        <button
                            onClick={handleExportClick}
                            className="btn-secondary"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Exportar
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
            </div>

            {/* Kanban Board */}
            <div className="p-6">
                <div className="overflow-x-auto">
                    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div className="flex space-x-6 min-h-[calc(100vh-200px)]">
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
                            {activeCard ? <KanbanCard card={activeCard} onClick={() => {}} /> : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            </div>

            {/* Card Modal */}
            {selectedCard && (
                <SimpleCardModal
                    card={selectedCard}
                    isOpen={isCardModalOpen}
                    onClose={() => {
                        setIsCardModalOpen(false)
                        setSelectedCard(null)
                    }}
                    onSave={async (updatedCard) => {
                        try {
                            console.log('🔄 Processando card:', updatedCard)

                            const isNewCard = selectedCard?.id.startsWith('temp_')

                            if (isNewCard) {
                                console.log('➕ Adicionando novo card ao estado')
                                setBoards(prevBoards =>
                                    prevBoards.map(board =>
                                        board.id === selectedBoard ? {
                                            ...board,
                                            columns: board.columns.map(column =>
                                                column.id === updatedCard.columnId
                                                    ? { ...column, cards: [...column.cards, updatedCard] }
                                                    : column
                                            )
                                        } : board
                                    )
                                )
                            } else {
                                console.log('🔄 Atualizando card existente')
                                const cardToUpdate = {
                                    ...selectedCard,
                                    ...updatedCard,
                                    id: updatedCard.id || selectedCard?.id,
                                    columnId: updatedCard.columnId || selectedCard?.columnId,
                                    position: updatedCard.position || selectedCard?.position || 0
                                }

                                setBoards(prevBoards =>
                                    prevBoards.map(board => ({
                                        ...board,
                                        columns: board.columns.map(column => ({
                                            ...column,
                                            cards: column.cards.map(card =>
                                                card.id === cardToUpdate.id ? cardToUpdate : card
                                            )
                                        }))
                                    }))
                                )
                            }

                            console.log('✅ Estado local atualizado com sucesso')

                        } catch (error) {
                            console.error('❌ Erro ao processar card:', error)
                        } finally {
                            setIsCardModalOpen(false)
                            setSelectedCard(null)
                        }
                    }}
                />
            )}

            {/* Create Card Modal */}
            <SimpleCreateModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCardCreated={handleCardCreated}
            />

            {/* Advanced Filters Modal */}
            {showFiltersModal && (
                <AdvancedFiltersModal
                    isOpen={showFiltersModal}
                    onClose={() => setShowFiltersModal(false)}
                    onApplyFilters={(newFilters) => {
                        console.log('Aplicar filtros:', newFilters)
                        setFilters(newFilters)
                        setShowFiltersModal(false)
                    }}
                    context="kanban"
                />
            )}

            {/* Export Modal */}
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                context="kanban"
                data={getExportData()}
                title={'Kanban_' + (currentBoard?.name?.replace(/\s+/g, '_') || 'Board')}
            />
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