# Overview

PONTA SOLTA is a futuristic task management system built with a modern full-stack architecture. The application provides comprehensive task tracking capabilities with Kanban boards (Teams > Boards > Cards), team collaboration, user management, and priority-based task organization. It uses a cyberpunk-inspired design theme with neon accents and a dark interface.

## Recent Changes (v3.3.0 - March 2026)

### Novas Features
- **Busca Global**: Botão "Buscar tarefa..." na sidebar abre dialog com busca em tempo real. Pesquisa por título, número de chamado ou responsável. Resultados mostram status, equipe, prazo. Clicar no resultado abre o modal de detalhes.
- **Filtros Avançados no Kanban**: Dois novos dropdowns na barra de filtros — Prioridade (Alta/Média/Baixa) e Responsável (lista de usuários). Filtros aplicados no frontend sobre os cards já carregados.
- **Foto de Perfil no Card**: O card do Kanban agora exibe a foto de perfil do responsável (Google OAuth), com fallback para iniciais.
- **Etiquetas Coloridas (Tags)**: Cards podem ter etiquetas coloridas. Admin/gestor cria etiquetas com nome + cor customizada. Qualquer usuário adiciona/remove etiquetas nos cards. Badges coloridos aparecem nos cards do Kanban e no modal de detalhes.
- **Indicador de SLA**: Cards com número de chamado + prazo exibem barra de progresso colorida (verde/amarelo/vermelho) indicando % do tempo restante. Painel completo no modal de detalhes na seção Prazos.

### Schema
- Nova tabela `tags` (id, name, color, createdAt) — etiquetas globais reutilizáveis
- Nova tabela `task_tags` (taskId, tagId) — many-to-many tasks ↔ tags
- `TaskWithDetails` agora inclui campo `tags?: Tag[]`

### Novos Endpoints
- `GET /api/tags` — lista todas as etiquetas
- `POST /api/tags` — cria etiqueta (admin/gestor)
- `POST /api/tasks/:id/tags` — adiciona etiqueta a tarefa
- `DELETE /api/tasks/:id/tags/:tagId` — remove etiqueta de tarefa

### Performance
- `hydrateTaskDetails` refatorado para batch queries (elimina N+1 para subtasks, comentários, shares e tags)

## Recent Changes (v3.2.0 - March 2026)

### Controle de Visibilidade por Papel
- **Membros veem só suas equipes**: `GET /api/teams` filtra automaticamente — membro recebe apenas as equipes em que é cadastrado; admin/gestor veem todas.
- **Membros veem só tasks das suas equipes**: `GET /api/tasks` restringe automaticamente para membros — retorna apenas tasks cujo `teamId` está nas equipes do membro, mais tasks onde o membro é assignee ou creator.
- **Proteção de boards por equipe**: `GET /api/teams/:id/boards` retorna `[]` se o membro não pertencer àquela equipe.
- **Novos métodos no storage**: `getTeamsByUser(userId)`, `getTeamIdsByUser(userId)` e suporte a filtro `teamIds` em `getTasks()`.

## Recent Changes (v3.1.0 - March 2026)

### Bug Fixes
- **PATCH tarefa (500)**: Corrigido erro ao marcar tarefa como concluída. O problema era que `completedAt: new Date().toISOString()` chegava como string ao Drizzle, que espera `Date`. Adicionado `insertTaskSchema.partial().parse(req.body)` na rota PATCH para coerção correta. O schema também foi atualizado para aceitar `null` nos campos de data (necessário ao reabrir tarefa).
- **Botão "Novo Usuário"**: Implementado dialog completo para cadastro de usuários com campos email, nome, sobrenome e papel.

### Novas Features
- **Transferência de Equipe**: No modal de detalhes do card, novo seletor "Equipe Responsável" permite mover o card para outra equipe. Ao transferir, o responsável e o quadro são limpos automaticamente (mantendo todos os demais dados).
- **Compartilhamento de Card**: Cards podem ser compartilhados com múltiplas equipes para registrar mérito coletivo. Nova seção "Compartilhar com Equipes" no modal mostra badges das equipes com opção de remover e selector para adicionar novas.
- **Novo endpoint POST /api/users**: Criação de usuários pelo painel (admin/gestor). Ao criar, o email é pré-cadastrado e quando o usuário fizer login via Google, seu acesso será concedido automaticamente.
- **Novos endpoints PATCH /api/users/:id**: Edição de dados de usuários.
- **Endpoints de compartilhamento**: GET/POST/DELETE /api/tasks/:id/shares para gerenciar compartilhamentos.

### Schema
- Nova tabela `task_shares` (taskId, teamId, sharedAt) — many-to-many para cards compartilhados entre equipes
- `TaskWithDetails` agora inclui campo `sharedTeams: Team[]`
- `insertUserSchema` exportado do schema para criação de usuários

## Recent Changes (v3.0.0 - March 2026)

### Teams > Boards > Cards Hierarchy
1. **New `boards` table** — Boards belong to a Team. Tasks belong to a Board (optional).
2. **New `team_members` junction table** — Many-to-many relationship between users and teams. Users can belong to multiple teams.
3. **`ticketNumber` field on tasks** — Optional field to link tasks to helpdesk tickets (e.g., INC-001).
4. **`boardId` field on tasks** — Tasks can now be scoped to a specific Kanban board.

### New Frontend Pages & Features
- **Equipes page** (`/equipes`): Full team management (CRUD), member management (add/remove), board management (create/delete boards per team), visible to all users, admin-only destructive actions.
- **Kanban Board with Board Selector**: Team + Board selector bar at the top of the Kanban view. Filtering by team and/or board updates the task list in real time.
- **Task Modal (Nova Tarefa)**: Added `N° Chamado` field, Team selector, Board selector (depends on team), and Responsável dropdown now loads actual users.
- **Task Details Modal**: Fully editable — status, priority, urgency, complexity, assignee (dropdown with all users), quick "Marcar como Concluído" / "Reabrir Tarefa" buttons, shows board and team badges.
- **Sidebar navigation**: Added "Equipes" nav item with Network icon.

### API Endpoints Added
- `GET /api/users` — list all users
- `GET/POST/PATCH/DELETE /api/teams` — full CRUD for teams
- `POST /api/teams/:id/members` + `DELETE /api/teams/:id/members/:userId` — manage members
- `GET /api/teams/:id/members` — list members of a team
- `GET /api/teams/:id/boards` — list boards for a team
- `GET/POST/PATCH/DELETE /api/boards` — full CRUD for boards
- `GET /api/tasks?boardId=xxx` — filter tasks by board

## Previous Changes (v2.5.0 - March 2026)

### Authentication System - Google OAuth Only
- Login exclusively via Google corporate account
- Admins auto-assigned by email: `luciano.filho@unimedcaruaru.com.br`, `luciano.filho4@unimedcaruaru.com.br`
- Session cookies: httpOnly, secure, sameSite: lax
- PostgreSQL session store

### Callback URL do Google OAuth
- Desenvolvimento: `https://<replit-dev-domain>/api/auth/google/callback`
- Produção: `https://<app>.replit.app/api/auth/google/callback`
- URL detectada automaticamente via `REPLIT_DOMAINS` env var

### Secrets Necessários
- `GOOGLE_CLIENT_ID` — Client ID do Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — Client Secret do Google Cloud Console
- `SESSION_SECRET` — Chave de sessão (já configurado)
- `DATABASE_URL` — PostgreSQL (já configurado)

# User Preferences

Preferred communication style: Simple, everyday language. Portuguese (Brazilian).

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack React Query for server state management
- **Forms**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **API**: RESTful API with CRUD operations for tasks, teams, boards, and users
- **Authentication**: Google OAuth via Passport.js + passport-google-oauth20
- **Session Management**: Express sessions with PostgreSQL store

## Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured via Neon serverless)
- **Schema**:
  - `users` — with Google OAuth fields, role-based access
  - `teams` — organization units
  - `team_members` — many-to-many junction (users ↔ teams)
  - `boards` — kanban boards belonging to a team
  - `tasks` — with priority, urgency, importance, complexity, ticketNumber, boardId
  - `subtasks` — breaking down larger tasks
  - `task_comments` — collaboration on tasks
  - `task_audit_log` — automatic change history
  - `sessions` — authentication state

## Key Features
- **Task Management**: Create, update, delete tasks with ticketNumber field and board assignment
- **Teams > Boards > Cards**: Full hierarchy with member management
- **Kanban Board**: Drag-and-drop with team/board filtering
- **Team Collaboration**: Multi-user support, any user can be in multiple teams
- **Priority System**: Four-dimensional priority classification (priority, urgency, importance, complexity)
- **Dashboard**: Real-time statistics and deadline notifications
- **User Management**: Role-based access (admin, manager, member)
- **Task History**: Automatic audit log of all changes
- **Comments**: Per-task commenting system

## Routes
- `/` — Dashboard
- `/kanban` — Kanban Board (supports ?teamId=&boardId= query params)
- `/tasks` — My Tasks
- `/equipes` — Teams Management
- `/team` — Team stats
- `/users` — User management
