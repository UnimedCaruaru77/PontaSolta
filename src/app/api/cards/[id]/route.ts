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
    const body = await request.json()
    
    console.log('🔄 API PUT /api/cards/[id] - Dados recebidos:', {
      cardId: params.id,
      body: body
    })
    
    // Validação básica
    if (!params.id) {
      return NextResponse.json({ error: 'ID do card é obrigatório' }, { status: 400 })
    }

    // Mapear apenas os campos que existem na tabela
    const updateData: any = {}
    
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.urgency !== undefined) updateData.urgency = body.urgency
    if (body.highImpact !== undefined) updateData.high_impact = body.highImpact
    if (body.isProject !== undefined) updateData.is_project = body.isProject
    if (body.assigneeId !== undefined) updateData.assignee_id = body.assigneeId || null
    if (body.startDate !== undefined) updateData.start_date = body.startDate || null
    if (body.endDate !== undefined) updateData.end_date = body.endDate || null
    if (body.lecomTicket !== undefined) updateData.lecom_ticket = body.lecomTicket || null

    // Atualizar timestamp
    updateData.updated_at = new Date().toISOString()

    console.log('📝 Dados mapeados para update:', updateData)

    const { data: card, error } = await supabase
      .from('cards')
      .update(updateData)
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) {
      console.error('❌ Erro Supabase:', error)
      return NextResponse.json({ 
        error: 'Erro ao atualizar card',
        supabaseError: error.message,
        details: error
      }, { status: 500 })
    }

    if (!card) {
      console.error('❌ Card não encontrado após update')
      return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 })
    }

    console.log('✅ Card atualizado com sucesso:', card)

    // Converter campos do banco para o formato do frontend
    const formattedCard = {
      ...card,
      highImpact: card.high_impact,
      isProject: card.is_project,
      assigneeId: card.assignee_id,
      startDate: card.start_date,
      endDate: card.end_date,
      lecomTicket: card.lecom_ticket,
      createdAt: card.created_at,
      updatedAt: card.updated_at
    }

    return NextResponse.json({ 
      success: true,
      card: formattedCard 
    })
    
  } catch (error) {
    console.error('❌ Erro interno na API:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
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