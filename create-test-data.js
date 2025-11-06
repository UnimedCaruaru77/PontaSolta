// Script para criar dados de teste no Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ixjlqvfznpqjkqecnmts.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4amxxdmZ6bnBxamtxZWNubXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5MjU1NzEsImV4cCI6MjA0NjUwMTU3MX0.Ej5zOCBytWNOp7OpLove8wOqnbKhfBdQNLZBOKJWBBs'

const supabase = createClient(supabaseUrl, supabaseKey)

const createTestData = async () => {
    try {
        console.log('🚀 Criando dados de teste...')

        // 1. Verificar se já existe um board
        const { data: existingBoards } = await supabase
            .from('boards')
            .select('*')
            .limit(1)

        if (existingBoards && existingBoards.length > 0) {
            console.log('✅ Já existem boards no banco:', existingBoards.length)
            return
        }

        // 2. Criar um board de teste
        const { data: board, error: boardError } = await supabase
            .from('boards')
            .insert({
                name: 'Kanban Service Desk',
                description: 'Board principal para gerenciamento de demandas',
                team_id: null
            })
            .select()
            .single()

        if (boardError) {
            console.error('❌ Erro ao criar board:', boardError)
            return
        }

        console.log('✅ Board criado:', board.name)

        // 3. Criar colunas padrão
        const columns = [
            { name: 'Backlog', position: 0, board_id: board.id },
            { name: 'Em Andamento', position: 1, board_id: board.id },
            { name: 'Em Revisão', position: 2, board_id: board.id },
            { name: 'Concluído', position: 3, board_id: board.id }
        ]

        const { data: createdColumns, error: columnsError } = await supabase
            .from('columns')
            .insert(columns)
            .select()

        if (columnsError) {
            console.error('❌ Erro ao criar colunas:', columnsError)
            return
        }

        console.log('✅ Colunas criadas:', createdColumns.length)

        // 4. Criar alguns cards de exemplo
        const cards = [
            {
                title: 'Configurar novo computador',
                description: 'Instalar sistema operacional e programas básicos para novo funcionário',
                priority: 'HIGH',
                urgency: 'URGENT',
                high_impact: true,
                is_project: false,
                column_id: createdColumns[0].id,
                position: 0,
                creator_id: '1'
            },
            {
                title: 'Resolver problema de impressora',
                description: 'Impressora do setor financeiro não está funcionando. TESTE',
                priority: 'MEDIUM',
                urgency: 'NOT_URGENT',
                high_impact: false,
                is_project: false,
                column_id: createdColumns[1].id,
                position: 0,
                creator_id: '1'
            }
        ]

        const { data: createdCards, error: cardsError } = await supabase
            .from('cards')
            .insert(cards)
            .select()

        if (cardsError) {
            console.error('❌ Erro ao criar cards:', cardsError)
            return
        }

        console.log('✅ Cards criados:', createdCards.length)
        console.log('🎉 Dados de teste criados com sucesso!')

    } catch (error) {
        console.error('❌ Erro geral:', error)
    }
}

createTestData()