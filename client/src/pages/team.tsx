import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";
import type { TaskWithDetails, TeamWithMembers, User } from "@shared/schema";

interface TeamMemberStats {
  user: User;
  activeTasks: number;
  completedTasks: number;
  criticalTasks: number;
  inProgressTasks: number;
}

export default function Team() {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const { data: teams, isLoading: teamsLoading } = useQuery<TeamWithMembers[]>({
    queryKey: ["/api/teams"],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ["/api/tasks"],
  });

  // Seleciona automaticamente a primeira equipe quando os dados chegam
  const effectiveTeamId = selectedTeamId ?? (teams?.[0]?.id ?? null);
  const selectedTeam = teams?.find((t) => t.id === effectiveTeamId) ?? null;
  const teamMembers = selectedTeam?.members ?? [];

  const getTeamStats = (): TeamMemberStats[] => {
    if (!tasks || teamMembers.length === 0) return [];

    const memberStatsMap = new Map<string, TeamMemberStats>();

    teamMembers.forEach((member: User) => {
      memberStatsMap.set(member.id, {
        user: member,
        activeTasks: 0,
        completedTasks: 0,
        criticalTasks: 0,
        inProgressTasks: 0,
      });
    });

    tasks.forEach((task: TaskWithDetails) => {
      if (!task.assigneeId || !memberStatsMap.has(task.assigneeId)) return;
      if (task.teamId !== effectiveTeamId) return;

      const stats = memberStatsMap.get(task.assigneeId)!;

      if (task.status === "done") {
        stats.completedTasks++;
      } else {
        stats.activeTasks++;
      }

      if (task.status === "in_progress") {
        stats.inProgressTasks++;
      }

      if (task.urgency === "critical" && task.importance === "high") {
        stats.criticalTasks++;
      }
    });

    return Array.from(memberStatsMap.values());
  };

  const getTeamTasksByStatus = () => {
    if (!tasks || !effectiveTeamId) return { todo: 0, inProgress: 0, review: 0, done: 0 };

    const teamTasks = tasks.filter((task: TaskWithDetails) => task.teamId === effectiveTeamId);

    return {
      todo: teamTasks.filter((t) => t.status === "todo").length,
      inProgress: teamTasks.filter((t) => t.status === "in_progress").length,
      review: teamTasks.filter((t) => t.status === "review").length,
      done: teamTasks.filter((t) => t.status === "done").length,
    };
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

  const getRoleName = (role?: string | null) => {
    switch (role) {
      case "admin": return "Administrador";
      case "manager": return "Gestor";
      case "member": return "Membro";
      default: return "Membro";
    }
  };

  if (teamsLoading || tasksLoading) {
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

  if (!teams || teams.length === 0) {
    return (
      <div className="space-y-6" data-testid="team-page">
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Você não é membro de nenhuma equipe</p>
            <p className="text-sm text-muted-foreground mt-1">
              Peça a um administrador para adicioná-lo a uma equipe
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const teamStats = getTeamStats();
  const taskStatusCounts = getTeamTasksByStatus();

  return (
    <div className="space-y-6" data-testid="team-page">
      {/* Seletor de equipe */}
      <div className="flex items-center gap-4">
        <Users className="w-5 h-5 text-muted-foreground shrink-0" />
        {teams.length === 1 ? (
          <div>
            <h2 className="text-lg font-semibold">{selectedTeam?.name}</h2>
            {selectedTeam?.description && (
              <p className="text-sm text-muted-foreground">{selectedTeam.description}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              value={effectiveTeamId ?? ""}
              onValueChange={(val) => setSelectedTeamId(val)}
            >
              <SelectTrigger className="w-64 bg-card border-border" data-testid="team-selector">
                <SelectValue placeholder="Selecione uma equipe" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTeam?.description && (
              <p className="text-sm text-muted-foreground">{selectedTeam.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Contadores por status */}
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

      {/* Membros da equipe */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
          <p className="text-sm text-muted-foreground">
            Desempenho e status atual de cada membro
          </p>
        </CardHeader>
        <CardContent>
          {teamStats.length === 0 ? (
            <div className="text-center py-12" data-testid="no-team-members">
              <p className="text-muted-foreground text-lg">Nenhum membro encontrado nesta equipe</p>
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
                          {member.profileImageUrl ? (
                            <img
                              src={member.profileImageUrl}
                              alt={getUserName(member.firstName, member.lastName, member.email)}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <AvatarFallback className="font-semibold text-background text-sm">
                              {getInitials(member.firstName, member.lastName, member.email)}
                            </AvatarFallback>
                          )}
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
