#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://mawuqulusiqdvgeyirpr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hd3VxdWx1c2lxZHZnZXlpcnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMTIzMDUsImV4cCI6MjA3NjU4ODMwNX0.5n1oS6j2oacfkeCbtMiOWK8m82raLCRTIsmFrmI6l7k'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSchema() {
  console.log('🏗️  Criando schema do banco de dados...\n')

  try {
    // Como não podemos executar DDL via API REST, vamos criar as tabelas uma por uma
    // usando a funcionalidade de RPC se disponível, ou instruir o usuário

    console.log('📋 As tabelas precisam ser criadas manualmente no painel do Supabase.')
    console.log('🔗 Acesse: https://mawuqulusiqdvgeyirpr.supabase.co')
    console.log('📝 Vá em SQL Editor e execute o conteúdo do arquivo: create-tables.sql')
    console.log('')
    console.log('📄 Conteúdo do SQL:')
    console.log('=' .repeat(50))
    
    // Ler e exibir o conteúdo do SQL
    const fs = require('fs')
    const sqlContent = fs.readFileSync('./create-tables.sql', 'utf8')
    console.log(sqlContent)
    
    console.log('=' .repeat(50))
    console.log('')
    console.log('⚡ Após executar o SQL, execute: node populate-supabase.js')

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

createSchema()