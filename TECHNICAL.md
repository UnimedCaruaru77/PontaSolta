# Documentação Técnica - PONTA SOLTA

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico
- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes + Prisma ORM
- **Banco de Dados:** PostgreSQL (Supabase) / SQLite (dev)
- **Autenticação:** JWT com cookies httpOnly
- **Deploy:** Vercel + GitHub Actions

### Estrutura de Pastas
```
src/
├── app/                    # App Router (Next.js 13+)
│   ├── api/               # API Routes
│   │   └── auth/          # Endpoints de autenticação
│   ├── dashboard/         # Página principal
│   ├── kanban/           # Interface Kanban
│   ├── projects/         # Gestão de projetos
│   ├── reports/          # Relatórios e métricas
│   ├── teams/            # Gestão de equipes
│   ├── admin/            # Administração
│   ├── my-space/         # Espaço pessoal
│   └── login/            # Autenticação
├── components/            # Componentes reutilizáveis
├── lib/                  # Utilitários e configurações
└── middleware.ts         # Middleware de autenticação
```

## 🎨 Design System

### Paleta de Cores
```css
/* Cores principais */
--primary-500: #22d3ee    /* Ciano */
--secondary-500: #8b5cf6  /* Roxo */
--dark-900: #0f172a       /* Fundo principal */

/* Cores de acento */
--accent-yellow: #fde047  /* Alto impacto */
--accent-orange: #fb923c  /* Urgente */
--accent-red: #ef4444     /* Crítico */
```

### Estados Visuais dos Cards
```css
/* Hierarquia visual (maior para menor prioridade) */
.card-priority-high-urgent  /* Vermelho piscante */
.card-high-impact          /* Amarelo com glow */
.card-priority-high        /* Preto com halo */
.card-urgent              /* Laranja piscante */
```

### Animações
- **Glow effects:** Para estados de alerta
- **Pulse animations:** Para elementos críticos
- **Smooth transitions:** 200ms para interações
- **Micro-interactions:** Hover states e feedback visual

## 🗄️ Modelo de Dados

### Entidades Principais

#### Users
```prisma
model User {
  id                      String   @id @default(cuid())
  email                   String   @unique
  name                    String?
  password                String
  role                    UserRole @default(MEMBER)
  sector                  String?
  branch                  String?
  phone                   String?
  lecomUsername           String?
  canOpenTicketsForOthers Boolean  @default(false)
  // Relations...
}
```

#### Cards
```prisma
model Card {
  id          String   @id @default(cuid())
  title       String
  description String?
  priority    Priority @default(MEDIUM)
  urgency     Urgency  @default(NOT_URGENT)
  highImpact  Boolean  @default(false)
  isProject   Boolean  @default(false)
  lecomTicket String?
  // Relations...
}
```

### Relacionamentos
- **Users ↔ Teams:** Many-to-Many (TeamMember)
- **Teams ↔ Boards:** One-to-Many
- **Boards ↔ Cards:** One-to-Many
- **Cards ↔ Projects:** One-to-One (opcional)
- **Cards ↔ ChecklistItems:** One-to-Many

## 🔐 Autenticação e Segurança

### JWT Implementation
```typescript
// Geração do token
const token = jwt.sign(
  { userId, email, role },
  process.env.NEXTAUTH_SECRET,
  { expiresIn: '7d' }
)

// Middleware de verificação
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  // Verificação e redirecionamento...
}
```

### Permissões por Role
- **ADMIN:** Acesso completo ao sistema
- **TEAM_LEADER:** Gestão de equipe e projetos
- **MEMBER:** Acesso básico a cards e tarefas

### Segurança
- Cookies httpOnly para tokens
- Validação de entrada com Zod
- Sanitização de dados
- Rate limiting (futuro)

## 🔌 Integração LECOM

### Endpoint de Integração
```typescript
const LECOM_CONFIG = {
  url: process.env.LECOM_API_URL,
  headers: {
    username: process.env.LECOM_USERNAME,
    password: process.env.LECOM_PASSWORD
  }
}
```

### Mapeamento de Campos
```typescript
interface LecomTicket {
  DETALHAMENTO_PROBLEMA: string  // Card.description
  CATEGORIA_INFORMADA: string    // Selecionado pelo usuário
  FILIAL_SOLICITANTE: string     // User.branch
  DEPARTAMENTO_SOLIC: string     // User.sector
  TELEFONE_CONTATO: string       // User.phone
  EMAIL_SOLICITANTE: string      // User.email
}
```

## 🎯 Estados e Fluxos

### Estados dos Cards
1. **Backlog** → Criado, aguardando início
2. **Em Andamento** → Sendo executado
3. **Em Revisão** → Aguardando aprovação
4. **Concluído** → Finalizado

### Fluxo de Criação de Card
1. Usuário preenche formulário
2. Sistema valida dados
3. Card é criado no banco
4. (Opcional) Integração com LECOM
5. Notificação para responsável
6. Histórico é registrado

### Fluxo de Projeto
1. Card marcado como "Projeto"
2. Tela de projeto é habilitada
3. Canvas e timeline são criados
4. Colaboradores são adicionados
5. Metodologia é definida

## 📊 Performance e Otimização

### Estratégias Implementadas
- **Server-side rendering** com Next.js
- **Lazy loading** de componentes
- **Memoização** de cálculos pesados
- **Debounce** em buscas
- **Pagination** em listas grandes

### Métricas Monitoradas
- Tempo de carregamento de páginas
- Tempo de resposta da API
- Taxa de erro de requests
- Uso de memória do cliente

## 🧪 Testes (Futuro)

### Estratégia de Testes
```typescript
// Unit Tests
describe('Card Utils', () => {
  test('should calculate priority class correctly', () => {
    expect(getCardPriorityClass('HIGH', 'URGENT', true))
      .toBe('card-priority-high-urgent')
  })
})

// Integration Tests
describe('API Routes', () => {
  test('POST /api/cards should create card', async () => {
    // Test implementation...
  })
})

// E2E Tests
describe('Kanban Flow', () => {
  test('should move card between columns', () => {
    // Cypress/Playwright test...
  })
})
```

## 🚀 Deploy e CI/CD

### Vercel Configuration
```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret"
  }
}
```

### GitHub Actions
- **Build** automático em PRs
- **Deploy** automático na main
- **Testes** antes do deploy
- **Lint** e validação de código

## 🔮 Roadmap Técnico

### V2 - Automações
- [ ] WebSockets para real-time
- [ ] Background jobs com Bull/Agenda
- [ ] Notificações push
- [ ] Cache com Redis

### V3 - Escalabilidade
- [ ] Microserviços
- [ ] Load balancing
- [ ] CDN para assets
- [ ] Database sharding

### V4 - IA/ML
- [ ] Análise de sentimento
- [ ] Previsão de prazos
- [ ] Recomendações automáticas
- [ ] Chatbot integrado

## 📝 Convenções de Código

### TypeScript
- Interfaces para props de componentes
- Tipos explícitos para APIs
- Strict mode habilitado
- No any permitido

### React
- Functional components apenas
- Hooks para estado
- Props drilling evitado
- Memoização quando necessário

### CSS
- Tailwind classes apenas
- Componentes reutilizáveis
- Design tokens consistentes
- Mobile-first approach

---

**Última atualização:** Outubro 2024  
**Versão:** 1.0.0