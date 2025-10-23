import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient as supabase } from '@/lib/supabase-simple'

// GET /api/projects - Buscar projetos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    // Buscar cards que são projetos
    let query = supabase
      .from('cards')
      .select(`
        *,
        creator:creator_id(id, name, email),
        assignee:assignee_id(id, name, email),
        board:board_id(id, name, team_id),
        project:projects(*)
      `)
      .eq('is_project', true)
      .order('created_at', { ascending: false })

    const { data: projectCards, error } = await query

    if (error) {
      console.error('Erro ao buscar projetos:', error)
      return NextResponse.json({ error: 'Erro ao buscar projetos' }, { status: 500 })
    }

    // Mapear colunas para status
    const getStatusFromColumnId = (columnId: string) => {
      if (columnId === 'col_1' || columnId === 'col_5') return 'PLANNING'
      if (columnId === 'col_2' || columnId === 'col_6') return 'IN_PROGRESS'
      if (columnId === 'col_3' || columnId === 'col_7') return 'REVIEW'
      if (columnId === 'col_4' || columnId === 'col_8') return 'COMPLETED'
      return 'PLANNING'
    }

    // Processar projetos
    const projects = projectCards?.map(card => {
      const projectStatus = getStatusFromColumnId(card.column_id)
      
      // Calcular progresso baseado no status
      let progress = 0
      switch (projectStatus) {
        case 'PLANNING': progress = 10; break
        case 'IN_PROGRESS': progress = 50; break
        case 'REVIEW': progress = 80; break
        case 'COMPLETED': progress = 100; break
      }

      return {
        id: card.id,
        title: card.title,
        description: card.description || 'Sem descrição',
        methodology: card.project?.methodology || 'AGILE',
        status: projectStatus,
        progress,
        startDate: card.start_date || card.created_at,
        endDate: card.end_date,
        team: card.board?.name || 'Equipe não definida',
        owner: card.creator || { id: '', name: 'Não definido', email: '' },
        collaborators: card.assignee ? [
          {
            id: card.assignee.id,
            name: card.assignee.name,
            role: 'Responsável'
          }
        ] : [],
        priority: card.priority,
        budget: null, // Não implementado ainda
        createdAt: card.created_at
      }
    }) || []

    // Filtrar por status se especificado
    const filteredProjects = status === 'all' 
      ? projects 
      : projects.filter(project => project.status === status)

    return NextResponse.json({ projects: filteredProjects })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/projects - Criar novo projeto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      methodology = 'AGILE',
      priority = 'MEDIUM',
      startDate,
      endDate,
      boardId,
      creatorId = 'user_1' // Usuário padrão
    } = body

    if (!title || !boardId) {
      return NextResponse.json({ 
        error: 'Título e Board ID são obrigatórios' 
      }, { status: 400 })
    }

    // Buscar primeira coluna do board (Planning)
    const { data: columns } = await supabase
      .from('columns')
      .select('id')
      .eq('board_id', boardId)
      .order('position')
      .limit(1)

    const columnId = columns?.[0]?.id || 'col_1'

    // Gerar ID único para o card
    const cardId = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Criar card do projeto
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .insert({
        id: cardId,
        title,
        description,
        priority,
        urgency: 'NOT_URGENT',
        high_impact: true, // Projetos são considerados de alto impacto
        is_project: true,
        creator_id: creatorId,
        board_id: boardId,
        column_id: columnId,
        start_date: startDate,
        end_date: endDate,
        position: 0
      })
      .select()
      .single()

    if (cardError) {
      console.error('Erro ao criar card do projeto:', cardError)
      return NextResponse.json({ error: 'Erro ao criar projeto' }, { status: 500 })
    }

    // Criar entrada na tabela de projetos
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        id: projectId,
        card_id: cardId,
        methodology,
        notes: description
      })
      .select()
      .single()

    if (projectError) {
      console.error('Erro ao criar projeto:', projectError)
      // Se falhar, deletar o card criado
      await supabase.from('cards').delete().eq('id', cardId)
      return NextResponse.json({ error: 'Erro ao criar projeto' }, { status: 500 })
    }

    return NextResponse.json({ 
      project: {
        id: cardId,
        title,
        description,
        methodology,
        status: 'PLANNING',
        progress: 10
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}