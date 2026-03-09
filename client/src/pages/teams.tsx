import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, Plus, Trash2, Settings, Layout, UserPlus, ChevronDown, ChevronRight
} from "lucide-react";
import type { TeamWithMembers, User, Board } from "@shared/schema";

function getInitials(user: User) {
  const f = user.firstName?.charAt(0) || '';
  const l = user.lastName?.charAt(0) || '';
  return (f + l).toUpperCase() || user.email.charAt(0).toUpperCase();
}

function TeamCard({ team, allUsers }: { team: TeamWithMembers; allUsers: User[] }) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const [expanded, setExpanded] = useState(true);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addBoardOpen, setAddBoardOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [boardName, setBoardName] = useState("");
  const [boardDesc, setBoardDesc] = useState("");

  const memberIds = new Set(team.members.map(m => m.id));
  const availableUsers = allUsers.filter(u => !memberIds.has(u.id));

  const addMemberMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/teams/${team.id}/members`, { userId: selectedUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Membro adicionado com sucesso!" });
      setAddMemberOpen(false);
      setSelectedUserId("");
    },
    onError: () => toast({ title: "Erro ao adicionar membro", variant: "destructive" }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("DELETE", `/api/teams/${team.id}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Membro removido" });
    },
    onError: () => toast({ title: "Erro ao remover membro", variant: "destructive" }),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/teams/${team.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Equipe excluída" });
    },
    onError: () => toast({ title: "Erro ao excluir equipe", variant: "destructive" }),
  });

  const createBoardMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/boards`, { name: boardName, description: boardDesc, teamId: team.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Quadro criado com sucesso!" });
      setAddBoardOpen(false);
      setBoardName("");
      setBoardDesc("");
    },
    onError: () => toast({ title: "Erro ao criar quadro", variant: "destructive" }),
  });

  const deleteBoardMutation = useMutation({
    mutationFn: (boardId: string) => apiRequest("DELETE", `/api/boards/${boardId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Quadro excluído" });
    },
    onError: () => toast({ title: "Erro ao excluir quadro", variant: "destructive" }),
  });

  return (
    <Card className="bg-card border border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-left"
          >
            {expanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
            <CardTitle className="text-lg font-semibold">{team.name}</CardTitle>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
              {team.members.length} membros
            </Badge>
          </button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={() => deleteTeamMutation.mutate()}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
        {team.description && (
          <p className="text-sm text-muted-foreground ml-6">{team.description}</p>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-5">
          {/* Members Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                <Users className="size-4" /> Membros
              </h4>
              {isAdmin && (
                <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                      <UserPlus className="size-3" /> Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-primary/30">
                    <DialogHeader>
                      <DialogTitle>Adicionar Membro — {team.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue placeholder="Selecione um usuário" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUsers.length === 0 ? (
                            <SelectItem value="_none" disabled>Todos os usuários já são membros</SelectItem>
                          ) : (
                            availableUsers.map(u => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => addMemberMutation.mutate()}
                        disabled={!selectedUserId || addMemberMutation.isPending}
                      >
                        {addMemberMutation.isPending ? "Adicionando..." : "Adicionar Membro"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {team.members.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Nenhum membro nesta equipe.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {team.members.map(member => (
                  <div key={member.id} className="flex items-center gap-2 bg-muted/30 rounded-full pl-1 pr-3 py-1">
                    <Avatar className="size-7">
                      <AvatarImage src={member.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {getInitials(member)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {member.firstName && member.lastName
                        ? `${member.firstName} ${member.lastName}`
                        : member.email}
                    </span>
                    <Badge className={
                      member.role === 'admin' ? 'bg-red-500/20 text-red-400 border-red-500/30 text-xs' :
                      member.role === 'manager' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs' :
                      'bg-muted text-muted-foreground text-xs'
                    }>
                      {member.role === 'admin' ? 'Admin' : member.role === 'manager' ? 'Gestor' : 'Membro'}
                    </Badge>
                    {isAdmin && (
                      <button
                        onClick={() => removeMemberMutation.mutate(member.id)}
                        className="text-muted-foreground hover:text-red-400 transition-colors ml-1"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Boards Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                <Layout className="size-4" /> Quadros
              </h4>
              {isAdmin && (
                <Dialog open={addBoardOpen} onOpenChange={setAddBoardOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                      <Plus className="size-3" /> Novo Quadro
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-primary/30">
                    <DialogHeader>
                      <DialogTitle>Novo Quadro — {team.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div>
                        <Label>Nome do Quadro</Label>
                        <Input
                          value={boardName}
                          onChange={e => setBoardName(e.target.value)}
                          placeholder="Ex: Sprint de Maio, Suporte Tier 1..."
                          className="bg-input border-border mt-1"
                        />
                      </div>
                      <div>
                        <Label>Descrição (opcional)</Label>
                        <Textarea
                          value={boardDesc}
                          onChange={e => setBoardDesc(e.target.value)}
                          placeholder="Descrição do quadro..."
                          className="bg-input border-border mt-1 resize-none"
                          rows={2}
                        />
                      </div>
                      <Button
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => createBoardMutation.mutate()}
                        disabled={!boardName.trim() || createBoardMutation.isPending}
                      >
                        {createBoardMutation.isPending ? "Criando..." : "Criar Quadro"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {team.boards.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Nenhum quadro criado.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {team.boards.map((board: Board) => (
                  <div
                    key={board.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border hover:border-primary/30 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Layout className="size-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{board.name}</p>
                        {board.description && (
                          <p className="text-xs text-muted-foreground">{board.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={`/kanban?boardId=${board.id}&teamId=${team.id}`}
                        className="inline-flex items-center justify-center rounded-md text-xs font-medium h-7 px-2 bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                      >
                        Abrir
                      </a>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => deleteBoardMutation.mutate(board.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function TeamsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const [createOpen, setCreateOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");

  const { data: teams = [], isLoading } = useQuery<TeamWithMembers[]>({
    queryKey: ["/api/teams"],
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createTeamMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/teams", { name: teamName, description: teamDesc }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Equipe criada com sucesso!" });
      setCreateOpen(false);
      setTeamName("");
      setTeamDesc("");
    },
    onError: () => toast({ title: "Erro ao criar equipe", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Equipes</h2>
          <p className="text-sm text-muted-foreground">Gerencie equipes, membros e quadros Kanban</p>
        </div>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Plus className="size-4" /> Nova Equipe
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-primary/30 neon-glow">
              <DialogHeader>
                <DialogTitle>Criar Nova Equipe</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Nome da Equipe</Label>
                  <Input
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    placeholder="Ex: Service Desk, Desenvolvimento..."
                    className="bg-input border-border mt-1"
                  />
                </div>
                <div>
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    value={teamDesc}
                    onChange={e => setTeamDesc(e.target.value)}
                    placeholder="Descreva o propósito desta equipe..."
                    className="bg-input border-border mt-1 resize-none"
                    rows={3}
                  />
                </div>
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => createTeamMutation.mutate()}
                  disabled={!teamName.trim() || createTeamMutation.isPending}
                >
                  {createTeamMutation.isPending ? "Criando..." : "Criar Equipe"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-40 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="size-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma equipe criada</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Crie sua primeira equipe para organizar membros e quadros Kanban
            </p>
            {isAdmin && (
              <Button
                onClick={() => setCreateOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                <Plus className="size-4" /> Criar Equipe
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {teams.map(team => (
            <TeamCard key={team.id} team={team} allUsers={allUsers as User[]} />
          ))}
        </div>
      )}
    </div>
  );
}
