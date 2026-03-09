import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import type { TaskWithDetails, User } from "@shared/schema";

interface TeamMemberStats {
  user: User;
  activeTasks: number;
  completedTasks: number;
  criticalTasks: number;
  inProgressTasks: number;
}

export default function Team() {
  const { user } = useAuth();

  const { data: tasks, isLoading: tasksLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: teamMembers, isLoading: membersLoading } = useQuery<User[]>({
    queryKey: user?.teamId ? ["/api/teams", user.teamId, "members"] : [],
    enabled: !!user?.teamId,
  });

  // Calculate team statistics
  const getTeamStats = () => {
    if (!tasks || !teamMembers) return [];

    const memberStatsMap = new Map<string, TeamMemberStats>();

    // Initialize stats for all team members
    teamMembers.forEach((member: User) => {
      memberStatsMap.set(member.id, {
        user: member,
        activeTasks: 0,
        completedTasks: 0,
        criticalTasks: 0,
        inProgressTasks: 0,
      });
    });

    // Calculate stats from tasks
    tasks.forEach((task: TaskWithDetails) => {
      if (task.assigneeId && memberStatsMap.has(task.assigneeId)) {
        const stats = memberStatsMap.get(task.assigneeId)!;
        
        if (task.status === 'done') {
          stats.completedTasks++;
        } else {
          stats.activeTasks++;
        }
        
        if (task.status === 'in_progress') {
          stats.inProgressTasks++;
        }
        
        if (task.urgency === 'critical' && task.importance === 'high') {
          stats.criticalTasks++;
        }
      }
    });

    return Array.from(memberStatsMap.values());
  };

  const getTeamTasksByStatus = () => {
    if (!tasks) return { todo: 0, inProgress: 0, review: 0, done: 0 };

    const teamTasks = user?.teamId 
      ? tasks.filter((task: TaskWithDetails) => task.teamId === user.teamId)
      : tasks.filter((task: TaskWithDetails) => 
          task.assigneeId === user?.id || task.creatorId === user?.id
        );

    return {
      todo: teamTasks.filter((task: TaskWithDetails) => task.status === 'todo').length,
      inProgress: teamTasks.filter((task: TaskWithDetails) => task.status === 'in_progress').length,
      review: teamTasks.filter((task: TaskWithDetails) => task.status === 'review').length,
      done: teamTasks.filter((task: TaskWithDetails) => task.status === 'done').length,
    };
  };

  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
    if (firstName && lastName) {
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    }
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

  const getRoleName = (role?: string | null) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gestor';
      case 'member': return 'Membro';
      default: return 'Membro';
    }
  };

  if (tasksLoading || membersLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-card border-border" data-testid="team-loading">
          <CardHeader>
            <div className="animate-pulse">
              <div className="h-6 bg-muted rounded w-48 mb-2"></div>
              <div className="h-4 bg-muted rounded w-96"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const teamStats = getTeamStats();
  const taskStatusCounts = getTeamTasksByStatus();

  return (
    <div className="space-y-6" data-testid="team-page">
      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary" data-testid="team-stat-todo">
                {taskStatusCounts.todo}
              </p>
              <p className="text-sm text-muted-foreground">A Fazer</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400" data-testid="team-stat-progress">
                {taskStatusCounts.inProgress}
              </p>
              <p className="text-sm text-muted-foreground">Em Progresso</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400" data-testid="team-stat-review">
                {taskStatusCounts.review}
              </p>
              <p className="text-sm text-muted-foreground">Em Revisão</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary" data-testid="team-stat-done">
                {taskStatusCounts.done}
              </p>
              <p className="text-sm text-muted-foreground">Concluídas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
          <p className="text-sm text-muted-foreground">
            Desempenho e status atual de cada membro da equipe
          </p>
        </CardHeader>
        <CardContent>
          {teamStats.length === 0 ? (
            <div className="text-center py-12" data-testid="no-team-members">
              <p className="text-muted-foreground text-lg">Nenhum membro da equipe encontrado</p>
              <p className="text-sm text-muted-foreground mt-2">
                {user?.teamId 
                  ? "Esta equipe ainda não possui membros" 
                  : "Você não está atribuído a nenhuma equipe"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {teamStats.map((memberStats) => {
                const member = memberStats.user;
                const totalTasks = memberStats.activeTasks + memberStats.completedTasks;
                const completionRate = totalTasks > 0 
                  ? Math.round((memberStats.completedTasks / totalTasks) * 100) 
                  : 0;

                return (
                  <Card 
                    key={member.id}
                    className="bg-background border-border"
                    data-testid={`team-member-${member.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <Avatar className="w-12 h-12 bg-primary">
                          <AvatarFallback className="font-semibold text-background text-sm">
                            {getInitials(member.firstName, member.lastName, member.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium" data-testid={`member-name-${member.id}`}>
                            {getUserName(member.firstName, member.lastName, member.email)}
                          </h4>
                          <p className="text-sm text-muted-foreground" data-testid={`member-role-${member.id}`}>
                            {getRoleName(member.role)}
                          </p>
                        </div>
                        {memberStats.criticalTasks > 0 && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/50 pulse-critical">
                            {memberStats.criticalTasks} CRÍTICAS
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-lg font-semibold text-primary" data-testid={`member-active-${member.id}`}>
                              {memberStats.activeTasks}
                            </p>
                            <p className="text-xs text-muted-foreground">Ativas</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-secondary" data-testid={`member-completed-${member.id}`}>
                              {memberStats.completedTasks}
                            </p>
                            <p className="text-xs text-muted-foreground">Concluídas</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-yellow-400" data-testid={`member-progress-${member.id}`}>
                              {memberStats.inProgressTasks}
                            </p>
                            <p className="text-xs text-muted-foreground">Em Progresso</p>
                          </div>
                        </div>
                        
                        {totalTasks > 0 && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Taxa de Conclusão</span>
                              <span data-testid={`member-completion-rate-${member.id}`}>
                                {completionRate}%
                              </span>
                            </div>
                            <Progress 
                              value={completionRate} 
                              className="h-2"
                              data-testid={`member-progress-bar-${member.id}`}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
