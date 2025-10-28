import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
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
import TaskModal from "@/components/task-modal";

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
        window.location.href = "/api/login";
      }, 500);
      return;
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

  const getCurrentView = () => {
    const path = location.split('/')[1] || 'dashboard';
    
    switch (path) {
      case 'kanban':
        return <KanbanBoard />;
      case 'tasks':
        return <Tasks />;
      case 'team':
        return <Team />;
      case 'users':
        return <Users />;
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

  const getPageTitle = () => {
    const path = location.split('/')[1] || 'dashboard';
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      kanban: 'Kanban',
      tasks: 'Minhas Tarefas',
      team: 'Equipe',
      users: 'Usuários'
    };
    return titles[path] || 'Dashboard';
  };

  const getPageDescription = () => {
    const path = location.split('/')[1] || 'dashboard';
    const descriptions: Record<string, string> = {
      dashboard: 'Gerencie suas tarefas e equipe',
      kanban: 'Visualize e organize tarefas em formato Kanban',
      tasks: 'Visualize e gerencie suas tarefas',
      team: 'Acompanhe o desempenho da sua equipe',
      users: 'Gerencie usuários e permissões'
    };
    return descriptions[path] || 'Gerencie suas tarefas e equipe';
  };

  return (
    <div className="flex h-screen bg-background" data-testid="home-container">
      <SidebarNav user={user} currentPath={location} />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4" data-testid="header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold" data-testid="page-title">
                {getPageTitle()}
              </h2>
              <p className="text-sm text-muted-foreground" data-testid="page-description">
                {getPageDescription()}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <TaskModal />
              
              <div className="flex items-center space-x-2">
                <div className="relative" data-testid="notifications">
                  <svg className="w-5 h-5 text-red-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3v-8a1 1 0 011-1h4a1 1 0 011 1v8h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd"></path>
                  </svg>
                  <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5">
                    3
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6" data-testid="main-content">
          {getCurrentView()}
        </main>
      </div>

    </div>
  );
}
