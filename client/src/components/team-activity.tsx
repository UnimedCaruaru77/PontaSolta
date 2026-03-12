import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { TaskWithDetails } from "@shared/schema";

export default function TeamActivity() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });

  if (isLoading) {
    return (
      <Card className="bg-card border-border" data-testid="team-activity-loading">
        <CardHeader>
          <CardTitle>Atividade da Equipe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const recentTasks = (tasks as any)?.slice(0, 5) || [];

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const taskDate = new Date(date);
    const diffMs = now.getTime() - taskDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Agora mesmo";
    if (diffMinutes < 60) return `${diffMinutes} minutos atrás`;
    if (diffHours < 24) return `${diffHours} horas atrás`;
    return `${diffDays} dias atrás`;
  };

  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
    if (firstName && lastName) return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return "U";
  };

  const getUserName = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (email) return email;
    return "Usuário";
  };

  const getActivityDescription = (task: TaskWithDetails) => {
    if (task.status === 'done') return `concluiu a tarefa "${task.title}"`;
    if (task.status === 'in_progress') return `moveu a tarefa "${task.title}" para Em Progresso`;
    return `criou a tarefa "${task.title}"`;
  };

  const getAvatarClasses = (status: string) => {
    switch (status) {
      case 'done':
        return { avatar: 'bg-secondary', fallback: 'text-secondary-foreground' };
      case 'in_progress':
        return { avatar: 'bg-primary', fallback: 'text-primary-foreground' };
      default:
        return { avatar: 'bg-muted', fallback: 'text-muted-foreground' };
    }
  };

  return (
    <Card className="bg-card border-border" data-testid="team-activity">
      <CardHeader>
        <CardTitle>Atividade da Equipe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentTasks.length === 0 ? (
          <div className="text-center py-8" data-testid="no-team-activity">
            <p className="text-muted-foreground">Nenhuma atividade recente</p>
          </div>
        ) : (
          recentTasks.map((task: TaskWithDetails) => {
            const user = task.assignee || task.creator;
            const initials = getInitials(user?.firstName, user?.lastName, user?.email);
            const userName = getUserName(user?.firstName, user?.lastName, user?.email);
            const { avatar, fallback } = getAvatarClasses(task.status);

            return (
              <div
                key={task.id}
                className="flex items-start space-x-3"
                data-testid={`activity-${task.id}`}
              >
                <Avatar className={`w-8 h-8 ${avatar}`}>
                  <AvatarFallback
                    className={`text-xs font-semibold ${fallback}`}
                    data-testid={`avatar-${task.id}`}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm" data-testid={`activity-description-${task.id}`}>
                    <span className="font-medium">{userName}</span> {getActivityDescription(task)}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid={`activity-time-${task.id}`}>
                    {formatTimeAgo(task.updatedAt || task.createdAt || new Date())}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
