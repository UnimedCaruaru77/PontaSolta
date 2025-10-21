# 🚀 Setup Rápido do Supabase - PONTA SOLTA

## 📋 Passo a Passo

### 1. Acesse o Painel do Supabase
🔗 **URL:** https://mawuqulusiqdvgeyirpr.supabase.co

### 2. Execute o SQL para Criar as Tabelas
1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie e cole todo o conteúdo do arquivo `create-tables.sql`
4. Clique em **Run** para executar

### 3. Popule os Dados Iniciais
No terminal, execute:
```bash
node populate-supabase.js
```

### 4. Inicie a Aplicação
```bash
npm run dev
```

### 5. Teste a Integração
1. Acesse http://localhost:3001
2. Faça login com: `luciano.filho@unimedcaruaru.com.br` / `Mudar@123`
3. Verifique o status do Supabase na sidebar (deve estar verde)
4. Clique em "Testar Supabase" para verificar a integração

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
- Status "Supabase conectado" (verde) na sidebar
- Dados carregando corretamente nas páginas
- Funcionalidades real-time funcionando

## 🔧 Troubleshooting

### Erro "Could not find table"
- Execute o SQL completo no painel do Supabase
- Verifique se todas as tabelas foram criadas

### Erro de Conexão
- Verifique se o projeto Supabase está ativo
- Confirme as credenciais no arquivo .env

### Dados Não Aparecem
- Execute: `node populate-supabase.js`
- Verifique as políticas RLS no Supabase

---

**Configuração atual:**
- **Projeto:** mawuqulusiqdvgeyirpr
- **URL:** https://mawuqulusiqdvgeyirpr.supabase.co
- **Região:** South America (São Paulo)