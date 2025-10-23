import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/boards - Buscar boards por equipe
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    let boardQuery = supabase
      .from('boards')
      .select(`
        *,
        team:team_id(id, name)
      `)
      .order('created_at')

    if (teamId) {
      boardQuery = boardQuery.eq('team_id', teamId)
    }

    const { data: boards, error: boardsError } = await boardQuery

    if (boardsError) {
      console.error('Erro ao buscar boards:', boardsError)
      return NextResponse.json({ error: 'Erro ao buscar boards' }, { status: 500 })
    }

    // Buscar colunas e cards para cada board
    const boardsWithColumns = await Promise.all(
      boards?.map(async (board) => {
        // Buscar colunas do board
        const { data: columns, error: columnsError } = await supabase
          .from('columns')
          .select('*')
          .eq('board_id', board.id)
          .order('position')

        if (columnsError) {
          console.error('Erro ao buscar colunas:', columnsError)
          return { ...board, columns: [] }
        }

        // Buscar cards para cada coluna
        const columnsWithCards = await Promise.all(
          columns?.map(async (column) => {
            const { data: cards, error: cardsError } = await supabase
              .from('cards')
              .select(`
                *,
                assignee:assignee_id(id, name, email),
                creator:creator_id(id, name, email)
              `)
              .eq('column_id', column.id)
              .order('position')

            if (cardsError) {
              console.error('Erro ao buscar cards:', cardsError)
              return { ...column, cards: [] }
            }

            return { ...column, cards: cards || [] }
          }) || []
        )

        return {
          ...board,
          columns: columnsWithCards
        }
      }) || []
    )

    return NextResponse.json({ boards: boardsWithColumns })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/boards - Criar novo board
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, teamId } = body

    if (!name || !teamId) {
      return NextResponse.json({ 
        error: 'Nome e Team ID são obrigatórios' 
      }, { status: 400 })
    }

    const { data: board, error } = await supabase
      .from('boards')
      .insert({
        name,
        description,
        team_id: teamId
      })
      .select(`
        *,
        team:team_id(id, name)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar board:', error)
      return NextResponse.json({ error: 'Erro ao criar board' }, { status: 500 })
    }

    return NextResponse.json({ board }, { status: 201 })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}