# 🚀 Setup Rápido do Supabase - PONTA SOLTA

## 📋 Passo a Passo

### 1. Acesse o Painel do Supabase
🔗 **URL:** https://mawuqulusiqdvgeyirpr.supabase.co

### 2. Execute o SQL para Criar as Tabelas
1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie e cole todo o conteúdo do arquivo `create-supabase-tables.sql`
4. Clique em **Run** para executar

### 3. Popule os Dados Iniciais
No terminal, execute:
```bash
node populate-supabase.js
```

### 4. Teste a Aplicação em Produção
1. Acesse: https://pontasolta-2ndtp3zih-unimed-caruarus-projects.vercel.app
2. Faça login com: `luciano.filho@unimedcaruaru.com.br` / `Mudar@123`
3. Teste as funcionalidades do Kanban

## ✅ Verificação

### No Painel do Supabase
- Vá em **Table Editor**
- Verifique se as tabelas foram criadas:
  - users (3 registros)
  - teams (2 registros)
  - boards (2 registros)
  - cards (3 registros)
  - etc.

### Na Aplicação
- Login funcionando
- Dashboard carregando dados
- Kanban com cards funcionais
- Drag & drop operacional

## 🔧 Troubleshooting

### Erro "Could not find table"
- Execute o SQL completo no painel do Supabase
- Verifique se todas as tabelas foram criadas

### Erro de Conexão
- Verifique se o projeto Supabase está ativo
- Confirme as credenciais nas variáveis de ambiente da Vercel

### Dados Não Aparecem
- Execute: `node populate-supabase.js`
- Verifique as políticas RLS no Supabase

### Funcionalidades Não Funcionam
- Verifique se as tabelas têm a estrutura correta
- Confirme se os dados foram inseridos
- Teste as APIs individualmente

---

**Configuração atual:**
- **Projeto:** mawuqulusiqdvgeyirpr
- **URL:** https://mawuqulusiqdvgeyirpr.supabase.co
- **Região:** South America (São Paulo)
- **Deploy:** https://pontasolta-2ndtp3zih-unimed-caruarus-projects.vercel.app