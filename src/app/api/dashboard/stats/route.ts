import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/dashboard/stats - Buscar estatísticas do dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    // Query base para cards
    let cardsQuery = supabase.from('cards').select('*')
    
    if (teamId) {
      // Se teamId for fornecido, filtrar por equipe através do board
      const { data: teamBoards } = await supabase
        .from('boards')
        .select('id')
        .eq('team_id', teamId)
      
      if (teamBoards && teamBoards.length > 0) {
        const boardIds = teamBoards.map(board => board.id)
        cardsQuery = cardsQuery.in('board_id', boardIds)
      }
    }

    const { data: cards, error: cardsError } = await cardsQuery

    if (cardsError) {
      console.error('Erro ao buscar cards:', cardsError)
      return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
    }

    // Calcular estatísticas
    const totalCards = cards?.length || 0
    const inProgress = cards?.filter(card => card.status === 'IN_PROGRESS').length || 0
    const completed = cards?.filter(card => card.status === 'DONE').length || 0
    const highPriority = cards?.filter(card => card.priority === 'HIGH').length || 0
    const urgent = cards?.filter(card => card.urgency === 'URGENT').length || 0
    
    // Cards vencidos (end_date < hoje)
    const today = new Date().toISOString().split('T')[0]
    const overdue = cards?.filter(card => 
      card.end_date && 
      card.end_date < today && 
      card.status !== 'DONE'
    ).length || 0

    // Buscar atividade recente (últimos 7 dias)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: recentActivity, error: activityError } = await supabase
      .from('cards')
      .select(`
        id,
        title,
        status,
        updated_at,
        creator:creator_id(name)
      `)
      .gte('updated_at', sevenDaysAgo.toISOString())
      .order('updated_at', { ascending: false })
      .limit(10)

    if (activityError) {
      console.error('Erro ao buscar atividade recente:', activityError)
    }

    // Buscar performance das equipes
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        boards(
          id,
          cards(id, status)
        )
      `)

    let teamPerformance: any[] = []
    if (!teamsError && teams) {
      teamPerformance = teams.map(team => {
        const allCards = team.boards?.flatMap((board: any) => board.cards || []) || []
        const completedCards = allCards.filter((card: any) => card.status === 'DONE').length
        const totalTeamCards = allCards.length
        const performance = totalTeamCards > 0 ? Math.round((completedCards / totalTeamCards) * 100) : 0

        return {
          name: team.name,
          performance,
          completedCards,
          totalCards: totalTeamCards
        }
      }).sort((a, b) => b.performance - a.performance)
    }

    const stats = {
      totalCards,
      inProgress,
      overdue,
      completed,
      highPriority,
      urgent,
      recentActivity: recentActivity || [],
      teamPerformance
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}