import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient as supabase } from '@/lib/supabase-simple'

// PUT /api/checklist/[id] - Atualizar item do checklist
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = params.id
    const { title, completed } = await request.json()

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (completed !== undefined) updateData.completed = completed

    const { data: updatedItem, error } = await supabase
      .from('checklist_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar item do checklist:', error)
      return NextResponse.json({ error: 'Erro ao atualizar item' }, { status: 500 })
    }

    return NextResponse.json({ item: updatedItem })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/checklist/[id] - Deletar item do checklist
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = params.id

    const { error } = await supabase
      .from('checklist_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('Erro ao deletar item do checklist:', error)
      return NextResponse.json({ error: 'Erro ao deletar item' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}