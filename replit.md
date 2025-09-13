# Overview

PONTA SOLTA is a futuristic task management system built with a modern full-stack architecture. The application provides comprehensive task tracking capabilities with features like Kanban boards, team collaboration, user management, and priority-based task organization. It uses a cyberpunk-inspired design theme with neon accents and a dark interface.

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