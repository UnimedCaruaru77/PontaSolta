#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')

// Configuração
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas!')
  console.log('Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const prisma = new PrismaClient()
const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateData() {
  console.log('🚀 Iniciando migração para Supabase...\n')

  try {
    // 1. Migrar usuários
    console.log('👥 Migrando usuários...')
    const users = await prisma.user.findMany()
    
    if (users.length > 0) {
      const { error: usersError } = await supabase
        .from('users')
        .upsert(users, { onConflict: 'id' })
      
      if (usersError) {
        console.error('Erro ao migrar usuários:', usersError.message)
      } else {
        console.log(`✅ ${users.length} usuários migrados`)
      }
    }

    // 2. Migrar equipes
    console.log('🏢 Migrando equipes...')
    const teams = await prisma.team.findMany()
    
    if (teams.length > 0) {
      const { error: teamsError } = await supabase
        .from('teams')
        .upsert(teams, { onConflict: 'id' })
      
      if (teamsError) {
        console.error('Erro ao migrar equipes:', teamsError.message)
      } else {
        console.log(`✅ ${teams.length} equipes migradas`)
      }
    }

    // 3. Migrar membros de equipe
    console.log('👤 Migrando membros de equipe...')
    const teamMembers = await prisma.teamMember.findMany()
    
    if (teamMembers.length > 0) {
      const { error: membersError } = await supabase
        .from('team_members')
        .upsert(teamMembers, { onConflict: 'id' })
      
      if (membersError) {
        console.error('Erro ao migrar membros:', membersError.message)
      } else {
        console.log(`✅ ${teamMembers.length} membros migrados`)
      }
    }

    // 4. Migrar quadros
    console.log('📋 Migrando quadros...')
    const boards = await prisma.board.findMany()
    
    if (boards.length > 0) {
      const { error: boardsError } = await supabase
        .from('boards')
        .upsert(boards, { onConflict: 'id' })
      
      if (boardsError) {
        console.error('Erro ao migrar quadros:', boardsError.message)
      } else {
        console.log(`✅ ${boards.length} quadros migrados`)
      }
    }

    // 5. Migrar colunas
    console.log('📊 Migrando colunas...')
    const columns = await prisma.column.findMany()
    
    if (columns.length > 0) {
      const { error: columnsError } = await supabase
        .from('columns')
        .upsert(columns, { onConflict: 'id' })
      
      if (columnsError) {
        console.error('Erro ao migrar colunas:', columnsError.message)
      } else {
        console.log(`✅ ${columns.length} colunas migradas`)
      }
    }

    // 6. Migrar cards
    console.log('🎯 Migrando cards...')
    const cards = await prisma.card.findMany()
    
    if (cards.length > 0) {
      const { error: cardsError } = await supabase
        .from('cards')
        .upsert(cards, { onConflict: 'id' })
      
      if (cardsError) {
        console.error('Erro ao migrar cards:', cardsError.message)
      } else {
        console.log(`✅ ${cards.length} cards migrados`)
      }
    }

    // 7. Migrar checklists
    console.log('✅ Migrando checklists...')
    const checklists = await prisma.checklistItem.findMany()
    
    if (checklists.length > 0) {
      const { error: checklistsError } = await supabase
        .from('checklist_items')
        .upsert(checklists, { onConflict: 'id' })
      
      if (checklistsError) {
        console.error('Erro ao migrar checklists:', checklistsError.message)
      } else {
        console.log(`✅ ${checklists.length} itens de checklist migrados`)
      }
    }

    // 8. Migrar projetos
    console.log('🚀 Migrando projetos...')
    const projects = await prisma.project.findMany()
    
    if (projects.length > 0) {
      const { error: projectsError } = await supabase
        .from('projects')
        .upsert(projects, { onConflict: 'id' })
      
      if (projectsError) {
        console.error('Erro ao migrar projetos:', projectsError.message)
      } else {
        console.log(`✅ ${projects.length} projetos migrados`)
      }
    }

    console.log('\n🎉 Migração concluída com sucesso!')
    console.log('📊 Resumo:')
    console.log(`   - ${users.length} usuários`)
    console.log(`   - ${teams.length} equipes`)
    console.log(`   - ${teamMembers.length} membros`)
    console.log(`   - ${boards.length} quadros`)
    console.log(`   - ${columns.length} colunas`)
    console.log(`   - ${cards.length} cards`)
    console.log(`   - ${checklists.length} checklists`)
    console.log(`   - ${projects.length} projetos`)

  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar migração
migrateData()