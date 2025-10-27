import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient as supabase } from '@/lib/supabase-simple'

// GET /api/teams - Listar todas as equipes
export async function GET(request: NextRequest) {
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select(`
        *,
        parent_team:parent_team_id(id, name),
        members:team_members(
          id,
          role,
          user:user_id(id, name, email)
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar equipes:', error)
      return NextResponse.json({ error: 'Erro ao buscar equipes' }, { status: 500 })
    }

    // Transformar dados para o formato esperado pelo frontend
    const formattedTeams = teams?.map(team => ({
      id: team.id,
      name: team.name,
      description: team.description,
      parentTeamId: team.parent_team_id,
      parentTeamName: team.parent_team?.name,
      members: team.members?.map((member: any) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        joinedAt: member.created_at,
        isActive: true
      })) || [],
      createdAt: team.created_at,
      isActive: team.is_active
    })) || []

    return NextResponse.json({ teams: formattedTeams })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/teams - Criar nova equipe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, parentTeamId } = body

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Nome e descrição são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        name,
        description,
        parent_team_id: parentTeamId || null,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        parent_team:parent_team_id(id, name)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar equipe:', error)
      return NextResponse.json({ error: 'Erro ao criar equipe' }, { status: 500 })
    }

    // Formatar resposta
    const formattedTeam = {
      id: team.id,
      name: team.name,
      description: team.description,
      parentTeamId: team.parent_team_id,
      parentTeamName: team.parent_team?.name,
      members: [],
      createdAt: team.created_at,
      isActive: team.is_active
    }

    return NextResponse.json({ team: formattedTeam }, { status: 201 })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}