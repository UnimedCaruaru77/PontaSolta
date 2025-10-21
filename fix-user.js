const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

const supabaseUrl = 'https://mawuqulusiqdvgeyirpr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hd3VxdWx1c2lxZHZnZXlpcnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMTIzMDUsImV4cCI6MjA3NjU4ODMwNX0.5n1oS6j2oacfkeCbtMiOWK8m82raLCRTIsmFrmI6l7k'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixUser() {
  try {
    console.log('Verificando usuário existente...')
    
    // Verificar se o usuário existe
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'luciano.filho@unimedcaruaru.com.br')
      .single()
    
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Erro ao buscar usuário:', selectError)
      return
    }
    
    if (existingUser) {
      console.log('Usuário encontrado:', existingUser.name)
      console.log('Senha atual (hash):', existingUser.password)
      
      // Verificar se a senha atual funciona
      const isValid = await bcrypt.compare('Mudar@123', existingUser.password)
      console.log('Senha atual é válida:', isValid)
      
      if (!isValid) {
        console.log('Atualizando senha...')
        const hashedPassword = await bcrypt.hash('Mudar@123', 10)
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ password: hashedPassword })
          .eq('email', 'luciano.filho@unimedcaruaru.com.br')
        
        if (updateError) {
          console.error('Erro ao atualizar senha:', updateError)
        } else {
          console.log('Senha atualizada com sucesso!')
        }
      }
    } else {
      console.log('Usuário não encontrado, criando...')
      const hashedPassword = await bcrypt.hash('Mudar@123', 10)
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          name: 'Luciano Filho',
          email: 'luciano.filho@unimedcaruaru.com.br',
          password: hashedPassword,
          role: 'admin',
          active: true
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('Erro ao criar usuário:', insertError)
      } else {
        console.log('Usuário criado com sucesso:', newUser)
      }
    }
    
    // Testar login
    console.log('\nTestando login...')
    const { data: testUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'luciano.filho@unimedcaruaru.com.br')
      .single()
    
    if (testUser) {
      const isValidLogin = await bcrypt.compare('Mudar@123', testUser.password)
      console.log('Login test result:', isValidLogin)
      console.log('User data:', {
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        role: testUser.role,
        active: testUser.active
      })
    }
    
  } catch (error) {
    console.error('Erro geral:', error)
  }
}

fixUser()