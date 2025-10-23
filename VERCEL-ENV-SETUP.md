# 🚀 Configuração de Variáveis de Ambiente - Vercel

## 📋 Variáveis Necessárias

Configure as seguintes variáveis de ambiente no painel da Vercel:

### 🔗 Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://mawuqulusiqdvgeyirpr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hd3VxdWx1c2lxZHZnZXlpcnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMTIzMDUsImV4cCI6MjA3NjU4ODMwNX0.5n1oS6j2oacfkeCbtMiOWK8m82raLCRTIsmFrmI6l7k
```

### 🗄️ Database Configuration
```
DATABASE_URL=postgresql://postgres:123%40mudar123@db.mawuqulusiqdvgeyirpr.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:123%40mudar123@db.mawuqulusiqdvgeyirpr.supabase.co:5432/postgres
```

### 🔐 Authentication
```
NEXTAUTH_SECRET=86fe62856bbe0120a7a78afe71b3c884aafea37ddebf5c00af8a4df6f89443fa
```

## 🛠️ Como Configurar na Vercel

### Método 1: Painel Web da Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Vá para o seu projeto
3. Clique em **Settings** → **Environment Variables**
4. Adicione cada variável individualmente:
   - **Name**: Nome da variável (ex: `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: Valor correspondente
   - **Environment**: Selecione `Production`, `Preview` e `Development`

### Método 2: Vercel CLI
```bash
# Instalar Vercel CLI (se não tiver)
npm i -g vercel

# Fazer login
vercel login

# Adicionar variáveis
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add NEXTAUTH_SECRET
```

### Método 3: Arquivo .env (Automático)
O arquivo `.env.vercel` já está configurado. A Vercel pode importar automaticamente durante o deploy.

## ✅ Verificação

Após configurar as variáveis:

1. **Redeploy** o projeto na Vercel
2. Verifique os logs de build para erros
3. Teste a aplicação em produção
4. Confirme se o Supabase está conectado

## 🔍 Troubleshooting

### Erro de Build
- Verifique se todas as 5 variáveis estão configuradas
- Confirme se não há espaços extras nos valores
- Verifique se a senha do banco está URL-encoded (`123%40mudar123`)

### Erro de Conexão com Supabase
- Confirme se o projeto Supabase está ativo
- Verifique se as URLs estão corretas
- Teste as credenciais no painel do Supabase

### Erro de Autenticação
- Confirme se `NEXTAUTH_SECRET` está configurado
- Verifique se o valor é uma string longa e segura
- Teste o login na aplicação

## 📊 Resumo das Variáveis

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública | Chave anônima do Supabase |
| `DATABASE_URL` | Privada | URL de conexão com PostgreSQL |
| `DIRECT_URL` | Privada | URL direta para migrações |
| `NEXTAUTH_SECRET` | Privada | Chave secreta para JWT |

---

**✨ Configuração atualizada para o projeto Ponta Solta**  
**🗓️ Última atualização:** Outubro 2024