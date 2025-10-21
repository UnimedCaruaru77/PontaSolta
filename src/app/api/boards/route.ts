import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/boards - Buscar boards por equipe
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    let query = supabase
      .from('boards')
      .select(`
        *,
        team:team_id(id, name),
        cards(
          *,
          assignee:assignee_id(id, name, email),
          creator:creator_id(id, name, email)
        )
      `)
      .order('created_at')

    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    const { data: boards, error } = await query

    if (error) {
      console.error('Erro ao buscar boards:', error)
      return NextResponse.json({ error: 'Erro ao buscar boards' }, { status: 500 })
    }

    // Organizar cards por status para criar colunas
    const boardsWithColumns = boards?.map(board => {
      const columns = [
        {
          id: 'backlog',
          name: 'Backlog',
          position: 0,
          cards: board.cards?.filter((card: any) => card.status === 'BACKLOG') || []
        },
        {
          id: 'in_progress',
          name: 'Em Andamento',
          position: 1,
          cards: board.cards?.filter((card: any) => card.status === 'IN_PROGRESS') || []
        },
        {
          id: 'review',
          name: 'Em Revisão',
          position: 2,
          cards: board.cards?.filter((card: any) => card.status === 'REVIEW') || []
        },
        {
          id: 'done',
          name: 'Concluído',
          position: 3,
          cards: board.cards?.filter((card: any) => card.status === 'DONE') || []
        }
      ]

      return {
        ...board,
        columns
      }
    })

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