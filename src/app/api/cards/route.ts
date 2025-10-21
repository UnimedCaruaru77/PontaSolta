import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/cards - Buscar cards por board
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const boardId = searchParams.get('boardId')

    if (!boardId) {
      return NextResponse.json({ error: 'Board ID é obrigatório' }, { status: 400 })
    }

    const { data: cards, error } = await supabase
      .from('cards')
      .select(`
        *,
        assignee:assignee_id(id, name, email),
        creator:creator_id(id, name, email)
      `)
      .eq('board_id', boardId)
      .order('position')

    if (error) {
      console.error('Erro ao buscar cards:', error)
      return NextResponse.json({ error: 'Erro ao buscar cards' }, { status: 500 })
    }

    return NextResponse.json({ cards })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/cards - Criar novo card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      priority,
      urgency,
      highImpact,
      isProject,
      assigneeId,
      creatorId,
      startDate,
      endDate,
      lecomTicket,
      boardId,
      status,
      position
    } = body

    if (!title || !boardId || !creatorId) {
      return NextResponse.json({ 
        error: 'Título, Board ID e Creator ID são obrigatórios' 
      }, { status: 400 })
    }

    const { data: card, error } = await supabase
      .from('cards')
      .insert({
        title,
        description,
        priority: priority || 'MEDIUM',
        urgency: urgency || 'NOT_URGENT',
        high_impact: highImpact || false,
        is_project: isProject || false,
        assignee_id: assigneeId,
        creator_id: creatorId,
        start_date: startDate,
        end_date: endDate,
        lecom_ticket: lecomTicket,
        board_id: boardId,
        status: status || 'BACKLOG',
        position: position || 0
      })
      .select(`
        *,
        assignee:assignee_id(id, name, email),
        creator:creator_id(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar card:', error)
      return NextResponse.json({ error: 'Erro ao criar card' }, { status: 500 })
    }

    return NextResponse.json({ card }, { status: 201 })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}