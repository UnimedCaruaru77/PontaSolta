# Configuração do Supabase - PONTA SOLTA

## 🔧 Configuração Inicial

### 1. Obter Credenciais do Supabase

No painel do Supabase (https://lmdjherqfyyxkngwdyhw.supabase.co):

1. **URL do Projeto:** `https://lmdjherqfyyxkngwdyhw.supabase.co`
2. **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZGpoZXJxZnl5eGtuZ3dkeWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMTIyNTEsImV4cCI6MjA3NjU4ODI1MX0.PLfrHtw7ASGnIPF5q0Qki_sVOA56XTjMFvTaRjorCcg`
3. **Senha do Banco:** [NECESSÁRIA - Obter no painel]

### 2. Configurar Variáveis de Ambiente

Substitua `[SUA-SENHA]` pela senha real do banco:

```env
# Database - Supabase PostgreSQL
DATABASE_URL="postgresql://postgres.lmdjherqfyyxkngwdyhw:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.lmdjherqfyyxkngwdyhw:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://lmdjherqfyyxkngwdyhw.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZGpoZXJxZnl5eGtuZ3dkeWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMTIyNTEsImV4cCI6MjA3NjU4ODI1MX0.PLfrHtw7ASGnIPF5q0Qki_sVOA56XTjMFvTaRjorCcg"
```

## 🚀 Comandos de Migração

### Setup Completo (Recomendado)
```bash
npm run supabase:setup
```

### Comandos Individuais
```bash
# 1. Aplicar migrações no Supabase
npx prisma migrate deploy

# 2. Gerar cliente Prisma
npx prisma generate

# 3. Popular dados iniciais
npx tsx prisma/seed.ts

# 4. Migrar dados existentes (se houver)
npm run supabase:migrate
```

## 🔍 Verificação da Integração

### 1. Status na Interface
- Acesse a aplicação
- Verifique o status do Supabase na sidebar
- Deve mostrar "Supabase conectado" em verde

### 2. Teste de Integração
- Clique em "Testar Supabase" na sidebar
- Execute operações de teste (criar/listar/deletar)
- Verifique se os dados aparecem no painel do Supabase

### 3. Verificação Manual no Supabase
1. Acesse o painel do Supabase
2. Vá em "Table Editor"
3. Verifique se as tabelas foram criadas:
   - users
   - teams
   - team_members
   - boards
   - columns
   - cards
   - checklist_items
   - projects
   - etc.

## 🔄 Funcionalidades Implementadas

### Real-time
- Atualizações em tempo real nos cards
- Sincronização automática entre usuários
- Status de conexão monitorado

### Hooks Personalizados
- `useSupabaseQuery`: Consultas reativas
- `useSupabaseRealtime`: Dados em tempo real
- `useSupabaseMutation`: Operações CRUD

### Componentes
- `SupabaseStatus`: Monitor de conexão
- `SupabaseTest`: Interface de teste

## 🛠️ Troubleshooting

### Erro de Conexão
1. Verifique se a senha está correta no .env
2. Confirme se o projeto Supabase está ativo
3. Teste a conexão com o componente de teste

### Tabelas Não Criadas
1. Execute: `npx prisma migrate deploy`
2. Verifique se não há erros no console
3. Confirme as permissões no Supabase

### Dados Não Sincronizam
1. Verifique se o Real-time está habilitado no Supabase
2. Confirme se as políticas RLS estão configuradas
3. Teste com o componente de teste

## 📊 Monitoramento

### Métricas Disponíveis
- Status de conexão em tempo real
- Número de operações por minuto
- Latência das consultas
- Erros de sincronização

### Logs
- Console do navegador para erros client-side
- Painel do Supabase para logs server-side
- Prisma logs para operações de banco

---

**Configuração preparada para:** Projeto lmdjherqfyyxkngwdyhw  
**Região:** South America (São Paulo)  
**Última atualização:** Outubro 2024