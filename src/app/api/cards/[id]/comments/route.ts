import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient as supabase } from '@/lib/supabase-simple'

// GET /api/cards/[id]/comments - Buscar comentários de um card
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:author_id(id, name, email)
      `)
      .eq('entity_id', params.id)
      .eq('entity_type', 'card')
      .is('parent_id', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar comentários:', error)
      return NextResponse.json({ error: 'Erro ao buscar comentários' }, { status: 500 })
    }

    // Buscar respostas para cada comentário
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const { data: replies, error: repliesError } = await supabase
          .from('comments')
          .select(`
            *,
            author:author_id(id, name, email)
          `)
          .eq('parent_id', comment.id)
          .order('created_at', { ascending: true })

        if (repliesError) {
          console.error('Erro ao buscar respostas:', repliesError)
          return { ...comment, replies: [] }
        }

        return {
          ...comment,
          replies: replies.map(reply => ({
            ...reply,
            isEdited: reply.updated_at !== null
          })),
          isEdited: comment.updated_at !== null
        }
      })
    )

    return NextResponse.json({ comments: commentsWithReplies })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/cards/[id]/comments - Criar comentário em um card
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { content, parentId, authorId = 'user_1' } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Conteúdo do comentário é obrigatório' },
        { status: 400 }
      )
    }

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        id: commentId,
        content: content.trim(),
        entity_id: params.id,
        entity_type: 'card',
        author_id: authorId,
        parent_id: parentId || null,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        author:author_id(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar comentário:', error)
      return NextResponse.json({ error: 'Erro ao criar comentário' }, { status: 500 })
    }

    return NextResponse.json({ 
      comment: {
        ...comment,
        isEdited: false
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}