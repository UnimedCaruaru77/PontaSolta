import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, lazy, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import SidebarNav from "@/components/ui/sidebar-nav";
import DashboardStats from "@/components/dashboard-stats";
import PriorityTasks from "@/components/priority-tasks";
import TeamActivity from "@/components/team-activity";
import DeadlineNotifications from "@/components/deadline-notifications";
import KanbanBoard from "@/components/kanban-board";
import Tasks from "@/pages/tasks";
import Team from "@/pages/team";
import Users from "@/pages/users";
import TeamsPage from "@/pages/teams";
import TaskModal from "@/components/task-modal";

const DashboardPage = lazy(() => import("@/pages/dashboard"));
const PerformancePage = lazy(() => import("@/pages/performance"));
const CalendarPage = lazy(() => import("@/pages/calendar"));
const HubPage = lazy(() => import("@/pages/hub"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
    </div>
  );
}

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você precisa fazer login. Redirecionando...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/auth/google";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const segment = location.split('/')[1] || 'dashboard';

  const getCurrentView = () => {
    switch (segment) {
      case 'kanban':
        return <KanbanBoard />;
      case 'tasks':
        return <Tasks />;
      case 'team':
        return <Team />;
      case 'users':
        return <Users />;
      case 'equipes':
        return <TeamsPage />;
      case 'analytics':
        return <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>;
      case 'performance':
        return <Suspense fallback={<PageLoader />}><PerformancePage /></Suspense>;
      case 'calendar':
        return <Suspense fallback={<PageLoader />}><CalendarPage /></Suspense>;
      case 'hub':
        return <Suspense fallback={<PageLoader />}><HubPage /></Suspense>;
      default:
        return (
          <div className="space-y-6">
            <DashboardStats />
            <DeadlineNotifications />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PriorityTasks />
              <TeamActivity />
            </div>
          </div>
        );
    }
  };

  const titles: Record<string, string> = {
    dashboard: 'Dashboard',
    analytics: 'Analytics',
    kanban: 'Kanban',
    tasks: 'Minhas Tarefas',
    team: 'Equipe',
    users: 'Usuários',
    equipes: 'Equipes',
    calendar: 'Calendário',
    hub: 'Hub da Equipe',
    performance: 'Desempenho',
  };

  const descriptions: Record<string, string> = {
    dashboard: 'Gerencie suas tarefas e equipe',
    analytics: 'Gráficos e métricas por equipe',
    kanban: 'Visualize e organize tarefas por equipe e quadro',
    tasks: 'Visualize e gerencie suas tarefas',
    team: 'Acompanhe o desempenho da sua equipe',
    users: 'Gerencie usuários e permissões',
    equipes: 'Crie e gerencie equipes, membros e quadros Kanban',
    calendar: 'Eventos e compromissos da equipe',
    hub: 'Membros, onboarding e comunicados da equipe',
    performance: 'Avaliação de competências e desempenho',
  };

  return (
    <div className="flex h-screen bg-background" data-testid="home-container">
      <SidebarNav user={user} currentPath={location} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 shrink-0" data-testid="header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold" data-testid="page-title">
                {titles[segment] || 'Dashboard'}
              </h2>
              <p className="text-sm text-muted-foreground" data-testid="page-description">
                {descriptions[segment] || 'Gerencie suas tarefas e equipe'}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <TaskModal />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6" data-testid="main-content">
          {getCurrentView()}
        </main>
      </div>
    </div>
  );
}
