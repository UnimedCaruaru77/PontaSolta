import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient as supabase } from '@/lib/supabase-simple'

// GET /api/cards/[id] - Buscar card específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: card, error } = await supabase
      .from('cards')
      .select(`
        *,
        assignee:assignee_id(id, name, email),
        creator:creator_id(id, name, email)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Erro ao buscar card:', error)
      return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ card })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT /api/cards/[id] - Atualizar card
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== INÍCIO PUT CARD ===')
    console.log('Card ID:', params.id)
    
    const body = await request.json()
    console.log('Body recebido:', body)
    
    const {
      title,
      description,
      priority,
      urgency,
      highImpact,
      isProject,
      assigneeId,
      startDate,
      endDate,
      lecomTicket,
      status,
      position,
      column_id
    } = body

    // Validação básica
    if (!params.id) {
      console.error('ID do card não fornecido')
      return NextResponse.json({ error: 'ID do card é obrigatório' }, { status: 400 })
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (priority !== undefined) updateData.priority = priority
    if (urgency !== undefined) updateData.urgency = urgency
    if (highImpact !== undefined) updateData.high_impact = highImpact
    if (isProject !== undefined) updateData.is_project = isProject
    if (assigneeId !== undefined) updateData.assignee_id = assigneeId
    if (startDate !== undefined) updateData.start_date = startDate
    if (endDate !== undefined) updateData.end_date = endDate
    if (lecomTicket !== undefined) updateData.lecom_ticket = lecomTicket
    if (status !== undefined) updateData.status = status
    if (position !== undefined) updateData.position = position
    if (column_id !== undefined) updateData.column_id = column_id

    console.log('Dados para atualização:', updateData)

    // Verificar se o card existe primeiro
    const { data: existingCard, error: checkError } = await supabase
      .from('cards')
      .select('id')
      .eq('id', params.id)
      .single()

    if (checkError || !existingCard) {
      console.error('Card não encontrado:', checkError)
      return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 })
    }

    console.log('Card existe, atualizando...')

    const { data: card, error } = await supabase
      .from('cards')
      .update(updateData)
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) {
      console.error('Erro do Supabase ao atualizar:', error)
      return NextResponse.json({ 
        error: 'Erro ao atualizar card', 
        details: error.message 
      }, { status: 500 })
    }

    console.log('Card atualizado com sucesso:', card)
    return NextResponse.json({ card })
    
  } catch (error) {
    console.error('Erro interno completo:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// DELETE /api/cards/[id] - Deletar card
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Erro ao deletar card:', error)
      return NextResponse.json({ error: 'Erro ao deletar card' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Card deletado com sucesso' })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}