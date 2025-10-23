import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabaseServerClient as supabase } from '@/lib/supabase-simple'

export async function POST(request: NextRequest) {
  try {
    // Verificar se o usuário tem permissão (apenas admins)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sincronizar dados do Prisma com Supabase
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        sector: true,
        branch: true,
        phone: true,
        lecomUsername: true,
        canOpenTicketsForOthers: true,
        createdAt: true,
        updatedAt: true
      }
    })

    const teams = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    const boards = await prisma.board.findMany({
      include: {
        team: true,
        columns: {
          include: {
            cards: {
              include: {
                creator: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                },
                assignee: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                },
                checklist: true
              }
            }
          }
        }
      }
    })

    // Inserir/atualizar no Supabase (usando upsert)
    const { error: usersError } = await supabase
      .from('users')
      .upsert(users, { onConflict: 'id' })

    if (usersError) {
      console.error('Erro ao sincronizar usuários:', usersError)
    }

    const { error: teamsError } = await supabase
      .from('teams')
      .upsert(teams.map(team => ({
        id: team.id,
        name: team.name,
        description: team.description,
        parentTeamId: team.parentTeamId,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
      })), { onConflict: 'id' })

    if (teamsError) {
      console.error('Erro ao sincronizar equipes:', teamsError)
    }

    return NextResponse.json({
      message: 'Sincronização concluída',
      stats: {
        users: users.length,
        teams: teams.length,
        boards: boards.length
      }
    })

  } catch (error) {
    console.error('Erro na sincronização:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}