import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient as supabase } from '@/lib/supabase-simple'

// PUT /api/comments/[id] - Atualizar comentário
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Conteúdo do comentário é obrigatório' },
        { status: 400 }
      )
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select(`
        *,
        author:author_id(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Erro ao atualizar comentário:', error)
      return NextResponse.json({ error: 'Erro ao atualizar comentário' }, { status: 500 })
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/comments/[id] - Excluir comentário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Primeiro, excluir todas as respostas
    const { error: repliesError } = await supabase
      .from('comments')
      .delete()
      .eq('parent_id', params.id)

    if (repliesError) {
      console.error('Erro ao excluir respostas:', repliesError)
    }

    // Depois, excluir o comentário principal
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Erro ao excluir comentário:', error)
      return NextResponse.json({ error: 'Erro ao excluir comentário' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Comentário excluído com sucesso' })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}