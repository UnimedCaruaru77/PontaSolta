# Overview

PONTA SOLTA is a futuristic task management system designed to streamline task tracking, team collaboration, and user management. It features Kanban boards, priority-based task organization, and a cyberpunk-inspired user interface. The project aims to provide comprehensive tools for efficient task management within a dynamic team environment, enhancing productivity and communication.

# User Preferences

Preferred communication style: Simple, everyday language. Portuguese (Brazilian).

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite
- **Routing**: Wouter
- **UI Components**: Shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables
- **State Management**: TanStack React Query
- **Forms**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js
- **API**: RESTful API
- **Authentication**: Google OAuth via Passport.js
- **Session Management**: Express sessions with PostgreSQL store

## Database Design
- **ORM**: Drizzle ORM with PostgreSQL
- **Database**: PostgreSQL (standard `pg` driver, compatible with Neon, Cloud SQL, RDS). Optional SSL via `USE_SSL=true` env var.
- **Schema Highlights**:
  - `users`: With Google OAuth fields and role-based access.
  - `teams`: Organizational units.
  - `team_members`: Many-to-many relationship between users and teams, including `is_lead` flag.
  - `boards`: Kanban boards belonging to a team.
  - `tasks`: With priority, urgency, importance, complexity, `ticketNumber`, `boardId`, `renegotiation_count`, and `last_renegotiated_at`.
  - `subtasks`: For breaking down larger tasks.
  - `task_comments`: For collaboration.
  - `task_audit_log`: Automatic change history.
  - `task_shares`: For sharing tasks across multiple teams and assigning specific members per share.
  - `task_dependencies`: To manage task prerequisites and blockages.
  - `tags`: Global reusable colored labels for tasks.
  - `task_tags`: Many-to-many relationship for tasks and tags.
  - `team_events`: For team calendar events.
  - `skill_definitions`: For defining skills in performance evaluations.
  - `member_evaluations`: To store performance scores for team members.
  - `team_settings`: To configure team-specific settings like dashboard visibility.
  - `task_templates`: Reusable templates for task creation.
  - `notifications`: Internal system notifications.
  - `onboarding_items`: Checklist items for team onboarding.
  - `onboarding_progress`: Tracks individual member's onboarding progress.
  - `sessions`: For authentication state.

## Key Features
- **Task Management**: CRUD operations with ticket number, board assignment, and detailed priority classification (priority, urgency, importance, complexity).
- **Team Hierarchy**: Teams > Boards > Cards structure with comprehensive team and member management.
- **Kanban Board**: Interactive board with drag-and-drop functionality, real-time filtering by team/board, and assignee photos.
- **Advanced Task Features**:
  - **Task Sharing**: Share tasks across multiple teams with specific assignees per team.
  - **Task Dependencies**: Define and manage task prerequisites, preventing work on blocked tasks.
  - **SLA Indicator**: Visual progress bar for task deadlines based on `ticketNumber` and due date.
  - **Status Renegotiation**: Automatic "Repactuado" status for overdue tasks with tracking.
  - **Task Templates**: Create and apply predefined task structures.
- **Collaboration & Communication**:
  - **Global Search**: Real-time task search by title, ticket number, or assignee.
  - **Task Comments**: Integrated commenting system.
  - **Internal Notifications**: Bell icon with unread count and activity alerts.
- **Team & User Management**:
  - **Role-Based Access Control**: Admin, manager, and member roles with granular permissions.
  - **Team Leader Role**: `is_lead` flag for team leadership functions.
  - **User Management**: CRUD for users with Google OAuth integration.
  - **Onboarding Checklists**: Customizable onboarding process per team.
- **Reporting & Analytics**:
  - **Performance Evaluation**: Radar chart for technical and behavioral skills.
  - **Dashboard Analytics**: Graphical representation of tasks by status, priority, and time evolution with CSV export.
  - **Event Calendar**: Monthly calendar view for team events with CRUD operations for leads/admins.
- **UI/UX**: Cyberpunk-inspired dark theme with neon accents, improved DatePicker components, and photo display for task assignees.
- **Visual Theme System**: 8 selectable themes (Neon Black, Midnight Navy, Slate & Coral, Ocean Depth, Forest Executive, Carbon & Ice, Royal Amethyst, Unimed). Theme saved to localStorage, applied via `data-theme` attribute on `<html>`. Selector available only to admins on the `/users` page. Implemented via `ThemeProvider` context in `client/src/hooks/useTheme.tsx`.

## Core Routes
- `/`: Dashboard
- `/kanban`: Kanban Board (with `teamId` and `boardId` filters)
- `/tasks`: My Tasks
- `/equipes`: Teams Management
- `/team`: Team statistics
- `/users`: User management
- `/analytics`: Dashboard for graphical analytics and CSV export
- `/performance`: Performance evaluation page
- `/calendar`: Event calendar
- `/hub`: Team hub with members, announcements, and onboarding checklists

# External Dependencies

- **Google Cloud Platform**: For Google OAuth (Google Client ID, Google Client Secret).
- **Neon**: Serverless PostgreSQL database hosting.
- **Passport.js**: For authentication middleware.
- **React-day-picker**: For calendar component functionality.