import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient as supabase } from '@/lib/supabase-simple'

// GET /api/cards/[id]/checklist - Buscar checklist do card
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cardId = params.id

    const { data: checklist, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('card_id', cardId)
      .order('position')

    if (error) {
      console.error('Erro ao buscar checklist:', error)
      return NextResponse.json({ error: 'Erro ao buscar checklist' }, { status: 500 })
    }

    return NextResponse.json({ checklist: checklist || [] })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/cards/[id]/checklist - Adicionar item ao checklist
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cardId = params.id
    const { title } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
    }

    // Buscar próxima posição
    const { data: existingItems } = await supabase
      .from('checklist_items')
      .select('position')
      .eq('card_id', cardId)
      .order('position', { ascending: false })
      .limit(1)

    const nextPosition = existingItems && existingItems.length > 0 
      ? existingItems[0].position + 1 
      : 0

    // Gerar ID único
    const itemId = `checklist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const { data: newItem, error } = await supabase
      .from('checklist_items')
      .insert({
        id: itemId,
        card_id: cardId,
        title,
        completed: false,
        position: nextPosition
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar item do checklist:', error)
      return NextResponse.json({ error: 'Erro ao criar item' }, { status: 500 })
    }

    return NextResponse.json({ item: newItem }, { status: 201 })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}