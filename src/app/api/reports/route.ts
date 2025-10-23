import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient as supabase } from '@/lib/supabase-simple'

// GET /api/reports - Buscar dados para relatórios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateRange = parseInt(searchParams.get('dateRange') || '30')
    const selectedTeam = searchParams.get('team') || 'all'

    // Calcular data de início baseada no range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - dateRange)

    console.log(`Generating reports for ${dateRange} days, team: ${selectedTeam}`)

    // Buscar dados com filtros
    let cardsQuery = supabase
      .from('cards')
      .select(`
        *,
        creator:creator_id(id, name, email),
        assignee:assignee_id(id, name, email),
        board:board_id(id, name, team_id)
      `)
      .gte('created_at', startDate.toISOString())

    // Filtrar por equipe se especificado
    if (selectedTeam !== 'all') {
      const { data: teamBoards } = await supabase
        .from('boards')
        .select('id')
        .eq('team_id', selectedTeam)
      
      if (teamBoards && teamBoards.length > 0) {
        const boardIds = teamBoards.map(board => board.id)
        cardsQuery = cardsQuery.in('board_id', boardIds)
      }
    }

    const { data: cards, error: cardsError } = await cardsQuery

    if (cardsError) {
      console.error('Erro ao buscar cards para relatório:', cardsError)
      return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 })
    }

    // Buscar equipes para performance
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')

    if (teamsError) {
      console.error('Erro ao buscar equipes:', teamsError)
    }

    // Mapear colunas para status
    const getStatusFromColumnId = (columnId: string) => {
      if (columnId === 'col_1' || columnId === 'col_5') return 'Backlog'
      if (columnId === 'col_2' || columnId === 'col_6') return 'Em Andamento'
      if (columnId === 'col_3' || columnId === 'col_7') return 'Em Revisão'
      if (columnId === 'col_4' || columnId === 'col_8') return 'Concluído'
      return 'Backlog'
    }

    const cardsWithStatus = cards?.map(card => ({
      ...card,
      status: getStatusFromColumnId(card.column_id)
    })) || []

    // 1. Cards por Status
    const statusCounts = {
      'Backlog': 0,
      'Em Andamento': 0,
      'Em Revisão': 0,
      'Concluído': 0
    }

    cardsWithStatus.forEach(card => {
      statusCounts[card.status as keyof typeof statusCounts]++
    })

    const cardsByStatus = [
      { name: 'Backlog', value: statusCounts.Backlog, color: '#64748b' },
      { name: 'Em Andamento', value: statusCounts['Em Andamento'], color: '#22d3ee' },
      { name: 'Em Revisão', value: statusCounts['Em Revisão'], color: '#8b5cf6' },
      { name: 'Concluído', value: statusCounts.Concluído, color: '#10b981' }
    ]

    // 2. Cards por Prioridade
    const priorityCounts = {
      'HIGH': 0,
      'MEDIUM': 0,
      'LOW': 0
    }

    cardsWithStatus.forEach(card => {
      priorityCounts[card.priority as keyof typeof priorityCounts]++
    })

    const cardsByPriority = [
      { name: 'Alta', value: priorityCounts.HIGH, color: '#ef4444' },
      { name: 'Média', value: priorityCounts.MEDIUM, color: '#fb923c' },
      { name: 'Baixa', value: priorityCounts.LOW, color: '#10b981' }
    ]

    // 3. Performance das Equipes
    const teamPerformance = teams?.map(team => {
      const teamCards = cardsWithStatus.filter(card => 
        card.board?.team_id === team.id
      )
      const completed = teamCards.filter(card => card.status === 'Concluído').length
      const total = teamCards.length
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

      return {
        team: team.name,
        completed,
        total,
        percentage
      }
    }).filter(team => team.total > 0) || []

    // 4. Tendência Mensal (últimos 6 meses)
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i)
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
      monthEnd.setDate(0)
      monthEnd.setHours(23, 59, 59, 999)

      const monthCards = cardsWithStatus.filter(card => {
        const createdAt = new Date(card.created_at)
        return createdAt >= monthStart && createdAt <= monthEnd
      })

      const completedInMonth = monthCards.filter(card => {
        if (card.status !== 'Concluído') return false
        const updatedAt = new Date(card.updated_at)
        return updatedAt >= monthStart && updatedAt <= monthEnd
      }).length

      monthlyTrend.push({
        month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        created: monthCards.length,
        completed: completedInMonth
      })
    }

    // 5. Métricas Gerais
    const now = new Date()
    const overdueCards = cardsWithStatus.filter(card => {
      if (!card.end_date || card.status === 'Concluído') return false
      return new Date(card.end_date) < now
    }).length

    // Tempo médio de conclusão (simplificado)
    const completedCards = cardsWithStatus.filter(card => card.status === 'Concluído')
    const avgCompletionTime = completedCards.length > 0 
      ? Math.round(completedCards.reduce((acc, card) => {
          const created = new Date(card.created_at)
          const updated = new Date(card.updated_at)
          return acc + (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        }, 0) / completedCards.length)
      : 0

    const totalCards = cardsWithStatus.length
    const completionRate = totalCards > 0 
      ? Math.round((completedCards.length / totalCards) * 100) 
      : 0

    const reportData = {
      cardsByStatus,
      cardsByPriority,
      teamPerformance,
      monthlyTrend,
      overdueCards,
      avgCompletionTime,
      totalCards,
      completionRate,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: dateRange
      }
    }

    console.log('Report generated successfully:', {
      totalCards,
      completionRate,
      overdueCards
    })

    return NextResponse.json({ reportData })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}