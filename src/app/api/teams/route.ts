import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient as supabase } from '@/lib/supabase-simple'

// GET /api/teams - Buscar todas as equipes
export async function GET() {
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select(`
        *,
        boards(id, name, description),
        members:team_members(
          user:user_id(id, name, email, role)
        )
      `)
      .order('name')

    if (error) {
      console.error('Erro ao buscar equipes:', error)
      return NextResponse.json({ error: 'Erro ao buscar equipes' }, { status: 500 })
    }

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/teams - Criar nova equipe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ 
        error: 'Nome é obrigatório' 
      }, { status: 400 })
    }

    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        name,
        description
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar equipe:', error)
      return NextResponse.json({ error: 'Erro ao criar equipe' }, { status: 500 })
    }

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}