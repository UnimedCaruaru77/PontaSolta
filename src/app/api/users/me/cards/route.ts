import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient as supabase } from '@/lib/supabase-simple'

// GET /api/users/me/cards - Buscar cards do usuário logado
export async function GET(request: NextRequest) {
  try {
    // Por enquanto, vamos usar um usuário padrão
    // Em uma implementação completa, extrairíamos o userId do token JWT
    const userId = 'user_1' // Usuário padrão para demonstração

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'

    // Buscar cards onde o usuário é o responsável (assignee)
    const { data: myCards, error: myCardsError } = await supabase
      .from('cards')
      .select(`
        *,
        creator:creator_id(id, name, email),
        assignee:assignee_id(id, name, email),
        board:board_id(id, name),
        column:column_id(id, name)
      `)
      .eq('assignee_id', userId)
      .order('updated_at', { ascending: false })

    // Buscar cards criados pelo usuário (delegados)
    const { data: delegatedCards, error: delegatedError } = await supabase
      .from('cards')
      .select(`
        *,
        creator:creator_id(id, name, email),
        assignee:assignee_id(id, name, email),
        board:board_id(id, name),
        column:column_id(id, name)
      `)
      .eq('creator_id', userId)
      .neq('assignee_id', userId) // Excluir cards que o usuário criou para si mesmo
      .order('updated_at', { ascending: false })

    if (myCardsError || delegatedError) {
      console.error('Erro ao buscar cards do usuário:', { myCardsError, delegatedError })
      return NextResponse.json({ error: 'Erro ao buscar cards' }, { status: 500 })
    }

    // Mapear colunas para status
    const getStatusFromColumnId = (columnId: string) => {
      if (columnId === 'col_1' || columnId === 'col_5') return 'Backlog'
      if (columnId === 'col_2' || columnId === 'col_6') return 'Em Andamento'
      if (columnId === 'col_3' || columnId === 'col_7') return 'Em Revisão'
      if (columnId === 'col_4' || columnId === 'col_8') return 'Concluído'
      return 'Backlog'
    }

    // Processar cards com status
    const processCards = (cards: any[]) => {
      return cards?.map(card => ({
        ...card,
        status: getStatusFromColumnId(card.column_id),
        boardName: card.board?.name || 'Board Desconhecido'
      })) || []
    }

    let myCardsProcessed = processCards(myCards || [])
    let delegatedCardsProcessed = processCards(delegatedCards || [])

    // Aplicar filtros
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    const applyFilter = (cards: any[]) => {
      switch (filter) {
        case 'overdue':
          return cards.filter(card => {
            if (!card.end_date) return false
            return new Date(card.end_date) < today
          })
        case 'today':
          return cards.filter(card => {
            if (!card.end_date) return false
            const endDate = new Date(card.end_date)
            return endDate >= today && endDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
          })
        case 'week':
          return cards.filter(card => {
            if (!card.end_date) return false
            const endDate = new Date(card.end_date)
            return endDate >= today && endDate <= weekFromNow
          })
        default:
          return cards
      }
    }

    if (filter !== 'all') {
      myCardsProcessed = applyFilter(myCardsProcessed)
      delegatedCardsProcessed = applyFilter(delegatedCardsProcessed)
    }

    // Estatísticas rápidas
    const stats = {
      myCards: {
        total: myCards?.length || 0,
        overdue: myCards?.filter(card => {
          if (!card.end_date) return false
          return new Date(card.end_date) < today
        }).length || 0,
        completed: myCards?.filter(card => getStatusFromColumnId(card.column_id) === 'Concluído').length || 0,
        inProgress: myCards?.filter(card => getStatusFromColumnId(card.column_id) === 'Em Andamento').length || 0
      },
      delegated: {
        total: delegatedCards?.length || 0,
        completed: delegatedCards?.filter(card => getStatusFromColumnId(card.column_id) === 'Concluído').length || 0,
        pending: delegatedCards?.filter(card => getStatusFromColumnId(card.column_id) !== 'Concluído').length || 0
      }
    }

    return NextResponse.json({
      myCards: myCardsProcessed,
      delegatedCards: delegatedCardsProcessed,
      stats
    })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}