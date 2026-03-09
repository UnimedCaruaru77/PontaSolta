import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserPlus, Settings, UserX } from "lucide-react";
import type { User } from "@shared/schema";
import { useState } from "react";

export default function Users() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserRole, setNewUserRole] = useState("member");

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: teams, isLoading: teamsLoading } = useQuery<any[]>({
    queryKey: ["/api/teams"],
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/users", {
        email: newUserEmail,
        firstName: newUserFirstName || undefined,
        lastName: newUserLastName || undefined,
        role: newUserRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Usuário criado com sucesso!" });
      setShowNewUserDialog(false);
      setNewUserEmail("");
      setNewUserFirstName("");
      setNewUserLastName("");
      setNewUserRole("member");
    },
    onError: (err: any) => {
      toast({
        title: err?.message || "Erro ao criar usuário",
        variant: "destructive",
      });
    },
  });

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

  const getRoleBadge = (role?: string | null) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Administrador</Badge>;
      case 'manager':
        return <Badge className="bg-primary/20 text-primary border-primary/50">Gestor</Badge>;
      default:
        return <Badge className="bg-secondary/20 text-secondary border-secondary/50">Membro</Badge>;
    }
  };

  const canManageUsers = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  if (usersLoading || teamsLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-card border-border">
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
                  : "Visualize membros do sistema"}
              </p>
            </div>
            {canManageUsers && (
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow"
                data-testid="button-new-user"
                onClick={() => setShowNewUserDialog(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {(allUsers as User[]).length === 0 ? (
            <div className="text-center py-12" data-testid="no-users">
              <p className="text-muted-foreground text-lg">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-muted/30">
                    <TableHead className="font-medium">Nome</TableHead>
                    <TableHead className="font-medium">Email</TableHead>
                    <TableHead className="font-medium">Cargo</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    {canManageUsers && <TableHead className="font-medium">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(allUsers as User[]).map((user: User) => (
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
                      <TableCell className="text-muted-foreground" data-testid={`user-email-${user.id}`}>
                        {user.email || "Não informado"}
                      </TableCell>
                      <TableCell data-testid={`user-role-${user.id}`}>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-secondary/20 text-secondary border-secondary/50">Ativo</Badge>
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

      {/* Team overview */}
      {teams && teams.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Equipes do Sistema</CardTitle>
            <p className="text-sm text-muted-foreground">Visão geral das equipes disponíveis</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team: any) => (
                <Card key={team.id} className="bg-background border-border" data-testid={`team-card-${team.id}`}>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-1">{team.name}</h4>
                    {team.description && (
                      <p className="text-sm text-muted-foreground mb-2">{team.description}</p>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {team.members?.length || 0} membros
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New User Dialog */}
      <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
        <DialogContent className="bg-black/95 border-primary/50 text-white">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2">
              <UserPlus className="size-5" />
              Novo Usuário
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-400">
            Pré-cadastre um usuário pelo email. Ao fazer login pelo Google com este email, o acesso será concedido automaticamente.
          </p>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Email *</Label>
              <Input
                value={newUserEmail}
                onChange={e => setNewUserEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                className="bg-black/40 border-primary/30 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-300">Nome</Label>
                <Input
                  value={newUserFirstName}
                  onChange={e => setNewUserFirstName(e.target.value)}
                  placeholder="João"
                  className="bg-black/40 border-primary/30 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-300">Sobrenome</Label>
                <Input
                  value={newUserLastName}
                  onChange={e => setNewUserLastName(e.target.value)}
                  placeholder="Silva"
                  className="bg-black/40 border-primary/30 text-white"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Papel</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger className="bg-black/40 border-primary/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-primary/50">
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="manager">Gestor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowNewUserDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createUserMutation.mutate()}
              disabled={!newUserEmail || createUserMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
