import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient as supabase } from '@/lib/supabase-simple'

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
    console.log('Creating card with data:', body)
    
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
      columnId,
      position
    } = body

    if (!title || !boardId || !creatorId || !columnId) {
      return NextResponse.json({ 
        error: 'Título, Board ID, Creator ID e Column ID são obrigatórios' 
      }, { status: 400 })
    }

    // Gerar ID único para o card
    const cardId = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const cardData = {
      id: cardId,
      title,
      description: description || null,
      priority: priority || 'MEDIUM',
      urgency: urgency || 'NOT_URGENT',
      high_impact: highImpact || false,
      is_project: isProject || false,
      assignee_id: assigneeId || null,
      creator_id: creatorId,
      start_date: startDate || null,
      end_date: endDate || null,
      lecom_ticket: lecomTicket || null,
      board_id: boardId,
      column_id: columnId,
      position: position || 0
    }

    console.log('Inserting card data:', cardData)

    const { data: card, error } = await supabase
      .from('cards')
      .insert(cardData)
      .select(`
        *,
        assignee:assignee_id(id, name, email),
        creator:creator_id(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar card:', error)
      return NextResponse.json({ error: `Erro ao criar card: ${error.message}` }, { status: 500 })
    }

    console.log('Card created successfully:', card)
    return NextResponse.json({ card }, { status: 201 })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}