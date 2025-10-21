# PONTA SOLTA

Sistema de controle de demandas e gestão de projetos com estética tecnológica e integração com IA.

## 🚀 Funcionalidades Implementadas

### ✅ V1 Core - Funcionalidades Básicas
- **Autenticação JWT** com login/logout seguro
- **Dashboard** com métricas e estatísticas em tempo real
- **Kanban por Equipes** com drag & drop
- **Cards de Demanda** com estados visuais de prioridade/urgência/impacto
- **Permissões Básicas** (Admin, Líder de Equipe, Membro)
- **Administração** de usuários e equipes
- **Meu Espaço** - visão pessoal do usuário
- **Projetos** - gerenciamento com diferentes metodologias
- **Relatórios** - métricas e análises de performance
- **Equipes** - gestão de equipes e membros

### 🎨 Design System Tecnológico
- Paleta escura com acentos neon
- Animações de glow/brilho para estados críticos
- Tipografia Inter moderna
- Microanimações suaves
- Efeitos visuais para prioridades

### 🔧 Arquitetura Técnica
- **Next.js 15** com TypeScript
- **Prisma ORM** para banco de dados
- **Tailwind CSS** com design system customizado
- **DnD Kit** para drag & drop
- **Lucide React** para ícones
- **JWT** para autenticação

## 🗄️ Configuração do Banco de Dados

### Opção 1: Supabase (Recomendado para Produção)

1. **Obtenha a senha do banco PostgreSQL no Supabase:**
   - Acesse o painel do Supabase
   - Vá em Settings > Database
   - Copie a senha do banco de dados

2. **Configure as variáveis de ambiente no `.env`:**
```env
# Database - Supabase
DATABASE_URL="postgresql://postgres.lmdjherqfyyxkngwdyhw:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.lmdjherqfyyxkngwdyhw:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://lmdjherqfyyxkngwdyhw.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZGpoZXJxZnl5eGtuZ3dkeWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMTIyNTEsImV4cCI6MjA3NjU4ODI1MX0.PLfrHtw7ASGnIPF5q0Qki_sVOA56XTjMFvTaRjorCcg"
```

3. **Execute a configuração automática:**
```bash
npm run supabase:setup
```

**OU manualmente:**
```bash
npx prisma migrate deploy
npx prisma generate
npx tsx prisma/seed.ts
npm run supabase:migrate
```

### Opção 2: SQLite (Desenvolvimento Local)

Mantenha as configurações atuais para desenvolvimento local:
```env
DATABASE_URL="file:./dev.db"
```

## 🚀 Instalação e Execução

1. **Clone o repositório:**
```bash
git clone https://github.com/UnimedCaruaru77/PontaSolta.git
cd PontaSolta
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure o banco de dados:**
```bash
npx prisma migrate dev --name init
npx prisma generate
npx tsx prisma/seed.ts
```

4. **Execute a aplicação:**
```bash
npm run dev
```

5. **Acesse:** http://localhost:3000

## 👤 Usuários Padrão

### Administrador
- **Email:** luciano.filho@unimedcaruaru.com.br
- **Senha:** Mudar@123
- **Permissões:** Administrador completo

### Usuários de Teste
- **Email:** edwa.favre@hospitalunimedcaruaru.com.br
- **Email:** marcos.barreto@unimedcaruaru.com.br
- **Senha:** 123456

## 🔗 Integração LECOM

### Configuração
```env
LECOM_API_URL="https://app-hom.unimedcaruaru.lecom.com.br/bpm/app/public/api/abre_processo"
LECOM_USERNAME="userunimed24"
LECOM_PASSWORD="lecom"
```

### Funcionalidades
- Abertura automática de chamados
- Vinculação de cards existentes
- Mapeamento de campos automático
- Feedback visual de status

## 📊 Estrutura do Banco de Dados

### Principais Entidades
- **Users** - Usuários com roles e configurações LECOM
- **Teams** - Equipes com hierarquia
- **Boards** - Quadros Kanban por equipe
- **Cards** - Demandas com prioridade/urgência/impacto
- **Projects** - Projetos com canvas e timeline
- **ChecklistItems** - Checklists hierárquicos
- **CardHistory** - Auditoria de mudanças

### Estados Visuais dos Cards
- **Vermelho (piscante):** Alta prioridade + Urgente
- **Amarelo (glow):** Alto impacto
- **Preto (halo):** Alta prioridade
- **Laranja (piscante):** Urgente

## 🎯 Próximas Implementações

### V2 - Automações e Integrações
- [ ] Automações de workflow
- [ ] Integrações com sistemas externos
- [ ] Notificações em tempo real
- [ ] API REST completa

### V3 - Relatórios Avançados
- [ ] Dashboards personalizáveis
- [ ] Exportação avançada
- [ ] Métricas de SLA
- [ ] Análise preditiva

### V4 - IA e Machine Learning
- [ ] Sugestões automáticas de prioridade
- [ ] Análise de sentimento
- [ ] Previsão de prazos
- [ ] Otimização de recursos

## 🛠️ Tecnologias Utilizadas

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Banco:** PostgreSQL (Supabase) / SQLite (dev)
- **Autenticação:** JWT com cookies seguros
- **UI/UX:** Lucide React, DnD Kit, Animações CSS
- **Deploy:** Vercel (recomendado)

## 📝 Licença

Este projeto é propriedade da Unimed Caruaru.

## 🤝 Contribuição

Para contribuir com o projeto:
1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Abra um Pull Request

---

**PONTA SOLTA v1.0** - Powered by AI Technology