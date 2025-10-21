#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando PONTA SOLTA...\n');

// Verificar se o .env existe
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ Arquivo .env não encontrado!');
  console.log('📝 Criando arquivo .env de exemplo...\n');
  
  const envExample = `# Database - SQLite (desenvolvimento local)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="ponta-solta-secret-key-2024"

# LECOM Integration
LECOM_API_URL="https://app-hom.unimedcaruaru.lecom.com.br/bpm/app/public/api/abre_processo"
LECOM_USERNAME="userunimed24"
LECOM_PASSWORD="lecom"

# Supabase (descomente para usar em produção)
# NEXT_PUBLIC_SUPABASE_URL="https://lmdjherqfyyxkngwdyhw.supabase.co"
# NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZGpoZXJxZnl5eGtuZ3dkeWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMTIyNTEsImV4cCI6MjA3NjU4ODI1MX0.PLfrHtw7ASGnIPF5q0Qki_sVOA56XTjMFvTaRjorCcg"
`;
  
  fs.writeFileSync(envPath, envExample);
  console.log('✅ Arquivo .env criado com configurações padrão\n');
}

try {
  console.log('📦 Instalando dependências...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependências instaladas\n');

  console.log('🗄️ Configurando banco de dados...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
  console.log('✅ Banco de dados configurado\n');

  console.log('🌱 Populando dados iniciais...');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
  console.log('✅ Dados iniciais criados\n');

  console.log('🎉 Setup concluído com sucesso!\n');
  console.log('📋 Próximos passos:');
  console.log('   1. Execute: npm run dev');
  console.log('   2. Acesse: http://localhost:3000');
  console.log('   3. Login: luciano.filho@unimedcaruaru.com.br');
  console.log('   4. Senha: Mudar@123\n');
  console.log('📚 Para mais informações, consulte o README.md');

} catch (error) {
  console.error('❌ Erro durante o setup:', error.message);
  process.exit(1);
}