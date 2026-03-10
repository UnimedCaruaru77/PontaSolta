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
import { useTheme } from "@/hooks/useTheme";
import { UserPlus, Settings, Palette, Check } from "lucide-react";
import type { User } from "@shared/schema";
import { useState } from "react";

export default function Users() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme, themes } = useTheme();

  // New user dialog
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserRole, setNewUserRole] = useState("member");

  // Edit user dialog
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editRole, setEditRole] = useState("member");

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
      toast({ title: err?.message || "Erro ao criar usuário", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async () => {
      if (!editingUser) return;
      await apiRequest("PATCH", `/api/users/${editingUser.id}`, {
        firstName: editFirstName || undefined,
        lastName: editLastName || undefined,
        role: editRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Usuário atualizado com sucesso!" });
      setEditingUser(null);
    },
    onError: (err: any) => {
      toast({ title: err?.message || "Erro ao atualizar usuário", variant: "destructive" });
    },
  });

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditFirstName(user.firstName || "");
    setEditLastName(user.lastName || "");
    setEditRole(user.role || "member");
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

  const getRoleName = (role?: string | null) => {
    if (role === 'admin') return 'Administrador';
    if (role === 'manager') return 'Gestor';
    return 'Membro';
  };

  const canManageUsers = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const canEditRole = currentUser?.role === 'admin';

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

      {/* ── Aparência do Sistema (apenas admin) ── */}
      {currentUser?.role === 'admin' && (
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>Aparência do Sistema</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Escolha o tema visual da interface. A preferência é salva localmente.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {themes.map((t) => {
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`
                      relative rounded-lg border-2 p-3 text-left transition-all duration-200
                      hover:scale-[1.03] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary
                      ${isActive
                        ? 'border-primary shadow-md'
                        : 'border-border hover:border-muted-foreground/50'}
                    `}
                    style={{ background: t.colors.bg }}
                  >
                    {/* Swatches de cor */}
                    <div className="flex gap-1 mb-2.5">
                      <div
                        className="h-4 flex-1 rounded-sm"
                        style={{ background: t.colors.sidebar }}
                      />
                      <div
                        className="h-4 flex-1 rounded-sm"
                        style={{ background: t.colors.primary }}
                      />
                      <div
                        className="h-4 flex-1 rounded-sm"
                        style={{ background: t.colors.accent }}
                      />
                    </div>
                    {/* Nome e descrição */}
                    <p
                      className="text-xs font-semibold leading-tight"
                      style={{ color: t.dark ? '#e5e5e5' : '#1a1a1a' }}
                    >
                      {t.label}
                    </p>
                    <p
                      className="text-[10px] mt-0.5 leading-tight opacity-70"
                      style={{ color: t.dark ? '#e5e5e5' : '#1a1a1a' }}
                    >
                      {t.description}
                    </p>
                    {/* Check quando ativo */}
                    {isActive && (
                      <span
                        className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full"
                        style={{ background: t.colors.primary }}
                      >
                        <Check className="w-3 h-3" style={{ color: t.dark ? '#000' : '#fff' }} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary/80"
                            data-testid={`button-edit-user-${user.id}`}
                            onClick={() => openEditDialog(user)}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
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

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) setEditingUser(null); }}>
        <DialogContent className="bg-black/95 border-primary/50 text-white">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2">
              <Settings className="size-5" />
              Editar Usuário
            </DialogTitle>
          </DialogHeader>
          {editingUser && (
            <>
              <p className="text-xs text-gray-400">
                Editando: <span className="text-white font-medium">{editingUser.email}</span>
              </p>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-300">Nome</Label>
                    <Input
                      value={editFirstName}
                      onChange={e => setEditFirstName(e.target.value)}
                      placeholder="João"
                      className="bg-black/40 border-primary/30 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-300">Sobrenome</Label>
                    <Input
                      value={editLastName}
                      onChange={e => setEditLastName(e.target.value)}
                      placeholder="Silva"
                      className="bg-black/40 border-primary/30 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-300">
                    Papel {!canEditRole && <span className="text-yellow-500">(apenas Admin pode alterar)</span>}
                  </Label>
                  <Select
                    value={editRole}
                    onValueChange={setEditRole}
                    disabled={!canEditRole}
                  >
                    <SelectTrigger className="bg-black/40 border-primary/30 text-white disabled:opacity-50">
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
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => updateUserMutation.mutate()}
                  disabled={updateUserMutation.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {updateUserMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
