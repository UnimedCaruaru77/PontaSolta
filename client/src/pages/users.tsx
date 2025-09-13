import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, Settings, UserX } from "lucide-react";
import type { User } from "@shared/schema";

export default function Users() {
  const { user: currentUser } = useAuth();

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/teams"],
  });

  // For now, we'll show team members if user has a team, or just current user
  const { data: teamMembers, isLoading: membersLoading } = useQuery({
    queryKey: currentUser?.teamId ? ["/api/teams", currentUser.teamId, "members"] : [],
    enabled: !!currentUser?.teamId,
  });

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

  const getRoleBadge = (role?: string | null) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Administrador</Badge>;
      case 'manager':
        return <Badge className="bg-primary/20 text-primary border-primary/50">Gestor</Badge>;
      case 'member':
        return <Badge className="bg-secondary/20 text-secondary border-secondary/50">Membro</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Membro</Badge>;
    }
  };

  const getStatusBadge = (user: User) => {
    // For now, assume all users are active
    return <Badge className="bg-secondary/20 text-secondary border-secondary/50">Ativo</Badge>;
  };

  const getTeamName = (teamId?: string | null) => {
    if (!teamId || !teams) return "Sem equipe";
    const team = teams.find((t: any) => t.id === teamId);
    return team?.name || "Equipe não encontrada";
  };

  const canManageUsers = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const displayUsers = teamMembers || (currentUser ? [currentUser] : []);

  if (teamsLoading || membersLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-card border-border" data-testid="users-loading">
          <CardHeader>
            <div className="animate-pulse">
              <div className="h-6 bg-muted rounded w-48 mb-2"></div>
              <div className="h-4 bg-muted rounded w-96"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="users-page">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <p className="text-sm text-muted-foreground">
                {canManageUsers 
                  ? "Gerencie usuários e permissões do sistema"
                  : "Visualize membros da sua equipe"}
              </p>
            </div>
            {canManageUsers && (
              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow"
                data-testid="button-new-user"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {displayUsers.length === 0 ? (
            <div className="text-center py-12" data-testid="no-users">
              <p className="text-muted-foreground text-lg">Nenhum usuário encontrado</p>
              <p className="text-sm text-muted-foreground mt-2">
                {currentUser?.teamId 
                  ? "Esta equipe ainda não possui membros"
                  : "Você não está atribuído a nenhuma equipe"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-muted/30">
                    <TableHead className="font-medium">Nome</TableHead>
                    <TableHead className="font-medium">Email</TableHead>
                    <TableHead className="font-medium">Cargo</TableHead>
                    <TableHead className="font-medium">Equipe</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    {canManageUsers && <TableHead className="font-medium">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayUsers.map((user: User) => (
                    <TableRow 
                      key={user.id}
                      className="border-border hover:bg-muted/30"
                      data-testid={`user-row-${user.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8 bg-primary">
                            <AvatarFallback className="text-xs font-semibold text-background">
                              {getInitials(user.firstName, user.lastName, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium" data-testid={`user-name-${user.id}`}>
                            {getUserName(user.firstName, user.lastName, user.email)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell 
                        className="text-muted-foreground"
                        data-testid={`user-email-${user.id}`}
                      >
                        {user.email || "Não informado"}
                      </TableCell>
                      <TableCell data-testid={`user-role-${user.id}`}>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell 
                        className="text-muted-foreground"
                        data-testid={`user-team-${user.id}`}
                      >
                        {getTeamName(user.teamId)}
                      </TableCell>
                      <TableCell data-testid={`user-status-${user.id}`}>
                        {getStatusBadge(user)}
                      </TableCell>
                      {canManageUsers && (
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-primary hover:text-primary/80"
                              data-testid={`button-edit-user-${user.id}`}
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                            {user.id !== currentUser?.id && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-muted-foreground hover:text-destructive"
                                data-testid={`button-deactivate-user-${user.id}`}
                              >
                                <UserX className="w-4 h-4 mr-1" />
                                Desativar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Statistics */}
      {teams && teams.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Equipes do Sistema</CardTitle>
            <p className="text-sm text-muted-foreground">
              Visão geral das equipes disponíveis
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team: any) => (
                <Card 
                  key={team.id}
                  className="bg-background border-border"
                  data-testid={`team-card-${team.id}`}
                >
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2" data-testid={`team-name-${team.id}`}>
                      {team.name}
                    </h4>
                    {team.description && (
                      <p className="text-sm text-muted-foreground mb-3" data-testid={`team-description-${team.id}`}>
                        {team.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {teamMembers?.filter((member: User) => member.teamId === team.id).length || 0} membros
                      </span>
                      {canManageUsers && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-manage-team-${team.id}`}
                        >
                          Gerenciar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
