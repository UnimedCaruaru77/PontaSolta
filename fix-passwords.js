#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

// Configuração do Supabase
const supabaseUrl = 'https://mawuqulusiqdvgeyirpr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hd3VxdWx1c2lxZHZnZXlpcnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMTIzMDUsImV4cCI6MjA3NjU4ODMwNX0.5n1oS6j2oacfkeCbtMiOWK8m82raLCRTIsmFrmI6l7k'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixPasswords() {
  console.log('🔧 Corrigindo senhas dos usuários...\n')

  try {
    // Gerar hash correto para a senha "Mudar@123"
    const password = 'Mudar@123'
    const hashedPassword = await bcrypt.hash(password, 12)
    
    console.log('🔐 Senha original:', password)
    console.log('🔐 Hash gerado:', hashedPassword)
    
    // Verificar se o hash funciona
    const isValid = await bcrypt.compare(password, hashedPassword)
    console.log('✅ Hash válido:', isValid)
    
    // Atualizar usuários com a senha correta
    const users = [
      {
        id: 'user_1',
        email: 'luciano.filho@unimedcaruaru.com.br',
        password: hashedPassword
      },
      {
        id: 'user_2', 
        email: 'edwa.favre@hospital.com.br',
        password: hashedPassword
      },
      {
        id: 'user_3',
        email: 'admin@pontasolta.com',
        password: hashedPassword
      }
    ]

    console.log('\n👥 Atualizando senhas dos usuários...')
    
    for (const user of users) {
      const { error } = await supabase
        .from('users')
        .update({ password: user.password })
        .eq('id', user.id)
      
      if (error) {
        console.error(`❌ Erro ao atualizar ${user.email}:`, error.message)
      } else {
        console.log(`✅ Senha atualizada para ${user.email}`)
      }
    }

    // Verificar se os usuários existem
    console.log('\n🔍 Verificando usuários no banco...')
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name, role')
    
    if (fetchError) {
      console.error('❌ Erro ao buscar usuários:', fetchError.message)
    } else {
      console.log('📊 Usuários encontrados:')
      allUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.name}) - ${user.role}`)
      })
    }

    console.log('\n🎉 Correção de senhas concluída!')
    console.log('🔐 Agora você pode fazer login com:')
    console.log('   Email: luciano.filho@unimedcaruaru.com.br')
    console.log('   Senha: Mudar@123')

  } catch (error) {
    console.error('❌ Erro durante a correção:', error.message)
    process.exit(1)
  }
}

// Executar correção
fixPasswords()