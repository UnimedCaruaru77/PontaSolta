import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
      position
    } = body

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

    const { data: card, error } = await supabase
      .from('cards')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        assignee:assignee_id(id, name, email),
        creator:creator_id(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Erro ao atualizar card:', error)
      return NextResponse.json({ error: 'Erro ao atualizar card' }, { status: 500 })
    }

    return NextResponse.json({ card })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
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