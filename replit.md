# Overview

PONTA SOLTA is a futuristic task management system built with a modern full-stack architecture. The application provides comprehensive task tracking capabilities with features like Kanban boards, team collaboration, user management, and priority-based task organization. It uses a cyberpunk-inspired design theme with neon accents and a dark interface.

## Recent Changes (v2.4.0 - October 28, 2025)

### 🔐 Authentication System Update
1. **Replaced Replit OAuth with Traditional Email/Password Authentication**:
   - Implemented Passport Local Strategy with bcrypt password hashing
   - Added Zod validation for login and registration endpoints
   - Created secure session management with httpOnly cookies
   - **FIXED**: Production cookie configuration now detects Replit deployment correctly
   - **FIXED**: Session store uses PostgreSQL in production for persistence across deploys

2. **Security Enhancements**:
   - Passwords hashed with bcrypt (10 rounds)
   - Session cookies configured: httpOnly, secure (HTTPS), sameSite: lax
   - CSRF protection via session middleware
   - Input validation on all auth endpoints

3. **Production Deployment Fix**:
   - Auto-detection of production environment via REPL_SLUG and REPLIT_DEPLOYMENT env vars
   - Proper cookie security for HTTPS in production deployments
   - PostgreSQL session store for published apps

### Admin Credentials
- Email: `luciano.filho@unimedcaruaru.com.br`
- Password: Set via `ADMIN_PASSWORD` environment secret
- Role: admin

**Note**: The admin user is automatically created on first deployment when the database is empty. The password is read from the `ADMIN_PASSWORD` secret for security. After first login, users should change their password.

## Previous Changes (v2.3.0 - October 28, 2025)

### ✅ Completed Features
1. **Task Comments System**: Full CRUD for task comments with user attribution and timestamps
2. **Audit Log (Task History)**: Automatic tracking of task creation and field changes with visual timeline
3. **Deadline Notifications**: Dashboard widget showing overdue, today, and upcoming tasks with color-coded sections
4. **Inline Status Editing**: TaskDetailsModal (Kanban) now allows status changes via Select dropdown
5. **Real-Time Cache Updates**: All task updates now trigger immediate dashboard and notification refreshes

### 🔧 Technical Improvements
- Fixed date handling in task creation (ISO string conversion)
- Improved date classification logic (day-level vs timestamp comparison)
- **CRITICAL FIX**: Changed `staleTime: Infinity` to `staleTime: 0` in queryClient for real-time updates
- **Centralized cache invalidation**: All three update paths (Kanban drag-and-drop, TaskDetailsModal, TaskDetailModal) now:
  - Call `invalidateQueries` for /api/tasks and /api/dashboard/stats
  - Call `refetchQueries` for both endpoints to force immediate refresh
- Fixed TaskDetailModal button logic: now shows both "Iniciar Tarefa" and "Marcar como Concluído" buttons when status is 'todo'
- Database cleanup of legacy epoch dates

### 🎯 Resolved Issues
- ✅ Cache invalidation now centralized across all task update paths
- ✅ Task details modals (both Kanban and My Tasks) now support status editing
- ✅ Dashboard statistics and deadline notifications update in real-time without page reload

# User Preferences

Preferred communication style: Simple, everyday language.

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
- **API**: RESTful API with CRUD operations for tasks, teams, and users
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL store
- **Middleware**: Custom logging and error handling middleware

## Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured via Neon serverless)
- **Schema**: 
  - Users table with team associations and role-based access
  - Teams table for organization structure
  - Tasks table with priority, urgency, importance, and complexity fields
  - Subtasks for breaking down larger tasks
  - Task comments for collaboration
  - Sessions table for authentication state

## Key Features
- **Task Management**: Create, update, delete tasks with multiple priority dimensions
- **Kanban Board**: Drag-and-drop interface for task status management
- **Team Collaboration**: Multi-user support with team-based task assignment
- **Priority System**: Four-dimensional priority classification (priority, urgency, importance, complexity)
- **Dashboard**: Real-time statistics and activity tracking
- **User Management**: Role-based access control (admin, manager, member)

## Development Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Code Quality**: TypeScript for type safety
- **Database Migrations**: Drizzle Kit for schema management
- **Development**: Hot module replacement and runtime error overlay

# External Dependencies

## Authentication
- **Replit Auth**: OAuth 2.0/OpenID Connect integration for user authentication
- **Passport.js**: Authentication middleware with OpenID strategy

## Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection Pooling**: @neondatabase/serverless for optimized connections

## UI/UX Libraries
- **Radix UI**: Accessible component primitives (@radix-ui/react-*)
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for component variant management
- **TailwindCSS**: Utility-first CSS framework with PostCSS

## Development Dependencies
- **Replit Plugins**: Cartographer and dev banner for Replit environment
- **Runtime Error Modal**: Enhanced error reporting during development

## Session Storage
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **Express Session**: Server-side session management

## Form Handling
- **React Hook Form**: Performant form library with validation
- **Zod**: Schema validation for type-safe data handling
- **@hookform/resolvers**: Integration between React Hook Form and Zod