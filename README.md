# 🚀 PONTA SOLTA

Sistema de Controle de Demandas e Gestão de Projetos desenvolvido com Next.js 15, TypeScript e Supabase.

## ✨ Funcionalidades

- 🔐 **Autenticação JWT** - Sistema seguro de login
- 📊 **Dashboard Interativo** - Estatísticas em tempo real
- 📋 **Kanban Board** - Gestão visual de tarefas por equipes
- 👥 **Gestão de Equipes** - Controle de usuários e permissões
- 📈 **Relatórios** - Métricas e análises de performance
- 🎨 **Design Tecnológico** - Interface moderna com tema dark e efeitos neon
- 📱 **Responsivo** - Funciona em desktop, tablet e mobile

## 🛠️ Tecnologias

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS v3.4.0
- **Database**: Supabase PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + Custom Auth
- **Deployment**: Vercel
- **Icons**: Lucide React

## 🚀 Deploy Rápido

### Vercel (Recomendado)

1. Conecte seu repositório GitHub à Vercel
2. Configure as variáveis de ambiente:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mawuqulusiqdvgeyirpr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hd3VxdWx1c2lxZHZnZXlpcnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMTIzMDUsImV4cCI6MjA3NjU4ODMwNX0.5n1oS6j2oacfkeCbtMiOWK8m82raLCRTIsmFrmI6l7k
NEXTAUTH_SECRET=86fe62856bbe0120a7a78afe71b3c884aafea37ddebf5c00af8a4df6f89443fa
DATABASE_URL=postgresql://postgres:123%40mudar123@db.mawuqulusiqdvgeyirpr.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:123%40mudar123@db.mawuqulusiqdvgeyirpr.supabase.co:5432/postgres
```

3. Deploy automático! 🎉

## 💻 Desenvolvimento Local

```bash
# Clone o repositório
git clone https://github.com/UnimedCaruaru77/PontaSolta.git

# Entre na pasta
cd PontaSolta

# Instale as dependências
npm install

# Configure o arquivo .env (use as variáveis acima)
cp .env.example .env

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

## 🔑 Credenciais de Teste

- **Email**: luciano.filho@unimedcaruaru.com.br
- **Senha**: Mudar@123

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 15)
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard principal
│   ├── kanban/           # Quadro Kanban
│   ├── login/            # Página de login
│   └── ...
├── components/           # Componentes reutilizáveis
├── hooks/               # Custom hooks
├── lib/                 # Utilitários e configurações
└── middleware.ts        # Middleware de autenticação
```

## 🎨 Design System

- **Cores Primárias**: Azul neon (#00D4FF)
- **Cores Secundárias**: Roxo neon (#8B5CF6)
- **Background**: Dark theme (#0F172A)
- **Efeitos**: Glow e gradientes neon

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Servidor de produção
npm run lint         # Linting do código
```

## 📊 Status do Projeto

✅ **Login e Autenticação** - Funcionando  
✅ **Dashboard** - Funcionando  
✅ **Kanban Board** - Funcionando  
✅ **APIs Supabase** - Funcionando  
✅ **Design Responsivo** - Funcionando  
✅ **Deploy Ready** - Pronto para produção  

## 🤝 Contribuição

Desenvolvido pela equipe de automação da Unimed Caruaru.

## 📄 Licença

Projeto proprietário - Unimed Caruaru © 2024