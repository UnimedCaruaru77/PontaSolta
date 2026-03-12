import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { TaskComments } from "./task-comments";
import { TaskAuditLog } from "./task-audit-log";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Calendar, User, Clock, AlertTriangle, CheckSquare,
  MessageSquare, FileText, History, Hash, CheckCircle2, XCircle,
  Users, Share2, X, Plus, ArrowRightLeft, Tag, Gauge, GitFork, Lock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TaskWithDetails, User as UserType, Team, Tag as TagType, TaskSummary, SharedTeamWithAssignee } from "@shared/schema";

interface TaskDetailsModalProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskClick?: (taskId: string) => void;
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
  if (firstName) return firstName[0].toUpperCase();
  return "U";
}

function getUserName(u?: UserType | null) {
  if (!u) return "Sem responsável";
  if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
  if (u.firstName) return u.firstName;
  return u.email;
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    todo: "A Fazer",
    in_progress: "Em Progresso",
    review: "Em Revisão",
    done: "Concluído",
    renegotiated: "Repactuado",
  };
  return labels[status] || status;
}

function getStatusBadgeClass(status: string) {
  if (status === 'done') return 'bg-green-500/20 text-green-400 border-green-500/40';
  if (status === 'renegotiated') return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
  if (status === 'in_progress') return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
  if (status === 'review') return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
  return 'bg-gray-500/20 text-muted-foreground border-gray-500/40';
}

export function TaskDetailsModal({ taskId, open, onOpenChange, onTaskClick }: TaskDetailsModalProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const { data: task, isLoading } = useQuery<TaskWithDetails>({
    queryKey: ["/api/tasks", taskId],
    enabled: !!taskId && open,
  });

  const { data: allUsers = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    enabled: open,
  });

  const { data: allTeams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    enabled: open,
  });

  const { data: allTags = [] } = useQuery<TagType[]>({
    queryKey: ["/api/tags"],
    enabled: open,
  });

  const { data: allTasks = [] } = useQuery<TaskWithDetails[]>({
    queryKey: ["/api/tasks"],
    enabled: open,
  });

  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#22c55e");
  const [showNewTag, setShowNewTag] = useState(false);
  const [depSearch, setDepSearch] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    queryClient.refetchQueries({ queryKey: ["/api/tasks"] });
    if (taskId) queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId] });
  };

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      await apiRequest("PATCH", `/api/tasks/${taskId}`, data);
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Tarefa atualizada com sucesso!" });
    },
    onError: (err: any) => toast({ title: err?.message || "Erro ao atualizar tarefa", variant: "destructive" }),
  });

  const shareMutation = useMutation({
    mutationFn: async (teamId: string) => {
      await apiRequest("POST", `/api/tasks/${taskId}/shares`, { teamId });
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Card compartilhado com a equipe!" });
    },
    onError: () => toast({ title: "Erro ao compartilhar", variant: "destructive" }),
  });

  const unshareMutation = useMutation({
    mutationFn: async (teamId: string) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}/shares/${teamId}`);
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Compartilhamento removido." });
    },
    onError: () => toast({ title: "Erro ao remover compartilhamento", variant: "destructive" }),
  });

  const setShareAssigneeMutation = useMutation({
    mutationFn: async ({ teamId, assigneeId }: { teamId: string; assigneeId: string | null }) => {
      await apiRequest("PATCH", `/api/tasks/${taskId}/shares/${teamId}`, { assigneeId });
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Responsável da equipe atualizado!" });
    },
    onError: () => toast({ title: "Erro ao atribuir responsável", variant: "destructive" }),
  });

  const addTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      await apiRequest("POST", `/api/tasks/${taskId}/tags`, { tagId });
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Etiqueta adicionada!" });
    },
    onError: () => toast({ title: "Erro ao adicionar etiqueta", variant: "destructive" }),
  });

  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}/tags/${tagId}`);
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Etiqueta removida." });
    },
    onError: () => toast({ title: "Erro ao remover etiqueta", variant: "destructive" }),
  });

  const createTagMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tags", { name: newTagName.trim(), color: newTagColor });
      const created = await res.json();
      await apiRequest("POST", `/api/tasks/${taskId}/tags`, { tagId: created.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      invalidate();
      setNewTagName("");
      setNewTagColor("#22c55e");
      setShowNewTag(false);
      toast({ title: "Etiqueta criada e adicionada!" });
    },
    onError: () => toast({ title: "Erro ao criar etiqueta", variant: "destructive" }),
  });

  const addDepMutation = useMutation({
    mutationFn: async (dependsOnTaskId: string) => {
      const res = await apiRequest("POST", `/api/tasks/${taskId}/dependencies`, { dependsOnTaskId });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro ao adicionar dependência");
      }
    },
    onSuccess: () => {
      invalidate();
      setDepSearch("");
      toast({ title: "Dependência adicionada!" });
    },
    onError: (err: any) => toast({ title: err?.message || "Erro ao adicionar dependência", variant: "destructive" }),
  });

  const removeDepMutation = useMutation({
    mutationFn: async (dependsOnTaskId: string) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}/dependencies/${dependsOnTaskId}`);
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Dependência removida." });
    },
    onError: () => toast({ title: "Erro ao remover dependência", variant: "destructive" }),
  });

  const getSlaInfo = () => {
    if (!task?.ticketNumber || !task?.dueDate) return null;
    const start = task.startDate ? new Date(task.startDate) : new Date(task.createdAt!);
    const end = new Date(task.dueDate);
    const now = new Date();
    const total = end.getTime() - start.getTime();
    if (total <= 0) return null;
    const elapsed = now.getTime() - start.getTime();
    const remainingPct = Math.max(0, Math.min(100, (1 - elapsed / total) * 100));
    if (now > end) return { pct: 0, barColor: 'bg-red-500', textColor: 'text-red-400', label: 'SLA vencido', status: 'Crítico' };
    if (remainingPct > 50) return { pct: remainingPct, barColor: 'bg-green-500', textColor: 'text-green-400', label: `${Math.round(remainingPct)}% restante`, status: 'Normal' };
    if (remainingPct > 25) return { pct: remainingPct, barColor: 'bg-yellow-500', textColor: 'text-yellow-400', label: `${Math.round(remainingPct)}% restante`, status: 'Atenção' };
    return { pct: remainingPct, barColor: 'bg-red-500', textColor: 'text-red-400', label: `${Math.round(remainingPct)}% restante`, status: 'Crítico' };
  };

  if (!task && !isLoading) return null;

  const getPriorityColor = (p: string) =>
    p === 'high' ? 'text-red-400 bg-red-500/20 border-red-500/50' :
    p === 'medium' ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50' :
    'text-blue-400 bg-blue-500/20 border-blue-500/50';

  const getUrgencyColor = (u: string) =>
    u === 'critical' ? 'text-red-400 bg-red-500/20 border-red-500/50' :
    u === 'high' ? 'text-orange-400 bg-orange-500/20 border-orange-500/50' :
    u === 'medium' ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50' :
    'text-muted-foreground bg-gray-500/20 border-gray-500/50';

  const calculateProgress = () => {
    if (!task || task.subtasks.length === 0) return 0;
    return Math.round((task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100);
  };

  const currentSharedTeamIds = new Set((task?.sharedTeams || []).map(t => t.id));
  const availableToShare = (allTeams as Team[]).filter(
    t => t.id !== task?.teamId && !currentSharedTeamIds.has(t.id)
  );

  // Dependencies: tasks that can be added (excluding self, already deps, and tasks that depend on this one)
  const currentDepIds = new Set((task?.dependencies || []).map(d => d.id));
  const currentDependentIds = new Set((task?.dependents || []).map(d => d.id));
  const availableForDep = (allTasks as TaskWithDetails[]).filter(
    t => t.id !== taskId && !currentDepIds.has(t.id) && !currentDependentIds.has(t.id)
  );
  const filteredDeps = depSearch.trim().length > 1
    ? availableForDep.filter(t =>
        t.title.toLowerCase().includes(depSearch.toLowerCase()) ||
        (t.ticketNumber && t.ticketNumber.toLowerCase().includes(depSearch.toLowerCase()))
      )
    : [];

  const isDayOverdue = (dueDate: string | Date | null | undefined) => {
    if (!dueDate) return false;
    const dueDay = new Date(dueDate);
    dueDay.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDay < today;
  };
  const isOverdue = task?.dueDate && isDayOverdue(task.dueDate) && task?.status !== 'done';
  const isRenegotiatedOverdue = task?.status === 'renegotiated' && isDayOverdue(task?.dueDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-2 border-primary/50 text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary flex items-center gap-3 flex-wrap">
            <FileText className="size-5 shrink-0" />
            <span className="flex-1 min-w-0 break-words">{task?.title || "Carregando..."}</span>
            {task?.ticketNumber && (
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 font-mono text-xs shrink-0">
                <Hash className="size-3 mr-1" />
                {task.ticketNumber}
              </Badge>
            )}
            {task?.blockedBy && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-xs shrink-0">
                <Lock className="size-3 mr-1" /> Bloqueada
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : task ? (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50">
              <TabsTrigger value="details" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                Detalhes
              </TabsTrigger>
              <TabsTrigger value="comments" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <MessageSquare className="size-4 mr-1" />
                Comentários ({task.comments?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <History className="size-4 mr-1" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-5 mt-5">
              {/* Status + Priority + Urgency + Complexity */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-muted/30 p-3 rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Status</p>
                  <Select
                    value={task.status}
                    onValueChange={v => updateMutation.mutate({ status: v })}
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger className={`h-8 text-xs border ${getStatusBadgeClass(task.status)}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="todo">A Fazer</SelectItem>
                      <SelectItem value="in_progress">Em Progresso</SelectItem>
                      <SelectItem value="review">Em Revisão</SelectItem>
                      <SelectItem value="done">Concluído</SelectItem>
                      <SelectItem value="renegotiated">Repactuado</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* Renegotiation info */}
                  {task.status === 'renegotiated' && (
                    <div className="mt-2 space-y-1">
                      {(task.renegotiationCount || 0) > 0 && (
                        <p className="text-[10px] text-orange-400">
                          {task.renegotiationCount}x repactuado
                        </p>
                      )}
                      {task.lastRenegotiatedAt && (
                        <p className="text-[10px] text-muted-foreground/70">
                          Última: {new Date(task.lastRenegotiatedAt).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      {isRenegotiatedOverdue && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[10px] px-1 py-0">
                          Repactuado · Atrasado
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-muted/30 p-3 rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Prioridade</p>
                  <Select
                    value={task.priority}
                    onValueChange={v => updateMutation.mutate({ priority: v })}
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger className={`h-8 text-xs border ${getPriorityColor(task.priority)}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted/30 p-3 rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Urgência</p>
                  <Select
                    value={task.urgency}
                    onValueChange={v => updateMutation.mutate({ urgency: v })}
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger className={`h-8 text-xs border ${getUrgencyColor(task.urgency)}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted/30 p-3 rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Complexidade</p>
                  <Select
                    value={task.complexity}
                    onValueChange={v => updateMutation.mutate({ complexity: v })}
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger className="h-8 text-xs bg-muted/30 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="simple">Simples</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="complex">Complexa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 flex-wrap">
                {task.status !== 'done' ? (
                  <Button
                    size="sm"
                    className="bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/40 gap-2"
                    onClick={() => updateMutation.mutate({ status: 'done', completedAt: new Date().toISOString() })}
                    disabled={updateMutation.isPending}
                  >
                    <CheckCircle2 className="size-4" />
                    Marcar como Concluído
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 text-muted-foreground"
                    onClick={() => updateMutation.mutate({ status: 'todo', completedAt: null })}
                    disabled={updateMutation.isPending}
                  >
                    <XCircle className="size-4" />
                    Reabrir Tarefa
                  </Button>
                )}
              </div>

              {/* Description */}
              {task.description && (
                <div className="bg-muted/30 p-4 rounded border border-border">
                  <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                    <FileText className="size-4" /> Descrição
                  </h4>
                  <p className="text-foreground/80 whitespace-pre-wrap text-sm">{task.description}</p>
                </div>
              )}

              {/* Assignee + Dates */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded border border-border">
                  <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <User className="size-4" /> Responsável Principal
                  </h4>
                  <div className="space-y-3">
                    {task.assignee && (
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 border border-primary/40">
                          <AvatarImage src={task.assignee.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {getInitials(task.assignee.firstName, task.assignee.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {task.assignee.firstName} {task.assignee.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{task.assignee.email}</p>
                        </div>
                      </div>
                    )}
                    <Select
                      value={task.assigneeId || "none"}
                      onValueChange={v => updateMutation.mutate({ assigneeId: v === 'none' ? null : v })}
                      disabled={updateMutation.isPending}
                    >
                      <SelectTrigger className="h-8 text-xs bg-muted/30 border-border">
                        <SelectValue placeholder="Alterar responsável..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="none">Nenhum responsável</SelectItem>
                        {currentUser && (
                          <SelectItem value={currentUser.id}>
                            Eu mesmo ({currentUser.firstName || currentUser.email})
                          </SelectItem>
                        )}
                        {(allUsers as UserType[])
                          .filter(u => u.id !== currentUser?.id)
                          .map(u => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.firstName && u.lastName
                                ? `${u.firstName} ${u.lastName}`
                                : u.email}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dates with DatePicker */}
                <div className="bg-muted/30 p-4 rounded border border-border space-y-3">
                  <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                    <Calendar className="size-4" /> Prazos
                  </h4>

                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" /> Data de início
                    </p>
                    <DatePicker
                      value={task.startDate ? new Date(task.startDate) : null}
                      onChange={date => updateMutation.mutate({ startDate: date ? date.toISOString() : null })}
                      disabled={updateMutation.isPending}
                      placeholder="Definir início..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <p className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
                      <AlertTriangle className="size-3" />
                      {isOverdue ? 'Prazo vencido — repactue abaixo' : 'Prazo final'}
                    </p>
                    <DatePicker
                      value={task.dueDate ? new Date(task.dueDate) : null}
                      onChange={date => updateMutation.mutate({ dueDate: date ? date.toISOString() : null })}
                      disabled={updateMutation.isPending}
                      placeholder="Definir prazo..."
                      isOverdue={!!isOverdue}
                    />
                    {isOverdue && (
                      <p className="text-[10px] text-orange-400/80">
                        Alterar o prazo irá mover esta tarefa para o status "Repactuado"
                      </p>
                    )}
                  </div>

                  {task.completedAt && (
                    <div className="flex items-center gap-2 text-sm pt-1 border-t border-primary/10">
                      <CheckCircle2 className="size-4 text-green-400 shrink-0" />
                      <span className="text-muted-foreground text-xs">Concluído em:</span>
                      <span className="text-green-400 text-xs">{new Date(task.completedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}

                  {/* SLA Indicator */}
                  {(() => {
                    const sla = getSlaInfo();
                    if (!sla) return null;
                    return (
                      <div className="pt-2 border-t border-primary/10">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Gauge className="size-3" /> SLA — {task.ticketNumber}
                          </p>
                          <span className={`text-xs font-semibold ${sla.textColor}`}>{sla.status}</span>
                        </div>
                        <div className="w-full h-2.5 bg-muted/40 rounded-full overflow-hidden border border-border">
                          <div
                            className={`h-full rounded-full transition-all ${sla.barColor}`}
                            style={{ width: `${sla.pct}%` }}
                          />
                        </div>
                        <p className={`text-xs mt-1 ${sla.textColor}`}>{sla.label}</p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Team Transfer + Sharing with assignees */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Transfer team */}
                <div className="bg-muted/30 p-4 rounded border border-border">
                  <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <ArrowRightLeft className="size-4" /> Equipe Responsável
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Transferir para outra equipe remove o responsável e o quadro atual.
                  </p>
                  <Select
                    value={task.teamId || "none"}
                    onValueChange={v => {
                      const newTeamId = v === 'none' ? null : v;
                      updateMutation.mutate({ teamId: newTeamId, assigneeId: null, boardId: null });
                    }}
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger className="h-8 text-xs bg-muted/30 border-border">
                      <SelectValue placeholder="Sem equipe" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="none">Sem equipe</SelectItem>
                      {(allTeams as Team[]).map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {task.board && (
                    <p className="text-xs text-yellow-400/70 mt-2">
                      Quadro atual: {task.board.name} — será removido ao transferir.
                    </p>
                  )}
                </div>

                {/* Share with teams + assignee per team */}
                <div className="bg-muted/30 p-4 rounded border border-border">
                  <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <Share2 className="size-4" /> Responsabilidade Compartilhada
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Compartilhe e designe um responsável de cada equipe parceira.
                  </p>

                  {/* Current shared teams */}
                  <div className="space-y-2 mb-3">
                    {(task.sharedTeams || []).length === 0 ? (
                      <span className="text-xs text-muted-foreground/70">Nenhuma equipe ainda</span>
                    ) : (
                      (task.sharedTeams as SharedTeamWithAssignee[]).map(t => {
                        // Get members of this shared team from allTeams
                        const teamObj = (allTeams as any[]).find((tm: any) => tm.id === t.id);
                        const members: UserType[] = teamObj?.members || [];
                        return (
                          <div key={t.id} className="bg-muted/20 rounded border border-border/50 p-2 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                                <Users className="size-3 mr-1" />
                                {t.name}
                              </Badge>
                              <button
                                onClick={() => unshareMutation.mutate(t.id)}
                                disabled={unshareMutation.isPending}
                                className="text-muted-foreground/70 hover:text-red-400 transition-colors"
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                            {/* Assignee for this shared team */}
                            <div className="flex items-center gap-2">
                              {t.assignee ? (
                                <Avatar className="size-5">
                                  <AvatarImage src={t.assignee.profileImageUrl || undefined} />
                                  <AvatarFallback className="text-[10px] bg-blue-500/20 text-blue-300">
                                    {getInitials(t.assignee.firstName, t.assignee.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                              ) : null}
                              <Select
                                value={t.assignee?.id || "none"}
                                onValueChange={v => setShareAssigneeMutation.mutate({
                                  teamId: t.id,
                                  assigneeId: v === 'none' ? null : v
                                })}
                                disabled={setShareAssigneeMutation.isPending}
                              >
                                <SelectTrigger className="h-7 text-[11px] bg-muted/30 border-border flex-1">
                                  <SelectValue placeholder="Atribuir responsável..." />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                  <SelectItem value="none">Sem responsável</SelectItem>
                                  {members.map(m => (
                                    <SelectItem key={m.id} value={m.id}>
                                      {m.firstName && m.lastName
                                        ? `${m.firstName} ${m.lastName}`
                                        : m.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add new team to share */}
                  {availableToShare.length > 0 && (
                    <Select
                      value=""
                      onValueChange={v => { if (v) shareMutation.mutate(v); }}
                      disabled={shareMutation.isPending}
                    >
                      <SelectTrigger className="h-8 text-xs bg-muted/30 border-border">
                        <Plus className="size-3 mr-1" />
                        <SelectValue placeholder="Adicionar equipe..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {availableToShare.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Dependencies */}
              <div className="bg-muted/30 p-4 rounded border border-border">
                <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <GitFork className="size-4" /> Dependências
                </h4>

                {/* Blocked by */}
                {(task.dependencies || []).length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Lock className="size-3" /> Esta tarefa aguarda:
                    </p>
                    <div className="space-y-1.5">
                      {(task.dependencies as TaskSummary[]).map(dep => (
                        <div key={dep.id} className="flex items-center justify-between bg-muted/20 rounded border border-red-500/20 p-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge className={`text-[10px] shrink-0 ${getStatusBadgeClass(dep.status)}`}>
                              {getStatusLabel(dep.status)}
                            </Badge>
                            <button
                              className="text-xs text-foreground/80 hover:text-primary truncate text-left"
                              onClick={() => dep.id && onTaskClick && onTaskClick(dep.id)}
                            >
                              {dep.ticketNumber && <span className="text-blue-400 font-mono mr-1">{dep.ticketNumber}</span>}
                              {dep.title}
                            </button>
                          </div>
                          <button
                            onClick={() => removeDepMutation.mutate(dep.id)}
                            disabled={removeDepMutation.isPending}
                            className="text-muted-foreground/70 hover:text-red-400 transition-colors shrink-0 ml-2"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dependents (tasks that depend on this) */}
                {(task.dependents || []).length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      Ao concluir esta tarefa, desbloqueia:
                    </p>
                    <div className="space-y-1.5">
                      {(task.dependents as TaskSummary[]).map(dep => (
                        <div key={dep.id} className="flex items-center gap-2 bg-muted/20 rounded border border-green-500/20 p-2">
                          <Badge className={`text-[10px] shrink-0 ${getStatusBadgeClass(dep.status)}`}>
                            {getStatusLabel(dep.status)}
                          </Badge>
                          <button
                            className="text-xs text-foreground/80 hover:text-primary truncate text-left"
                            onClick={() => dep.id && onTaskClick && onTaskClick(dep.id)}
                          >
                            {dep.ticketNumber && <span className="text-blue-400 font-mono mr-1">{dep.ticketNumber}</span>}
                            {dep.title}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add dependency */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Adicionar dependência (esta tarefa aguarda outra):</p>
                  <Input
                    placeholder="Buscar tarefa por título ou número..."
                    value={depSearch}
                    onChange={e => setDepSearch(e.target.value)}
                    className="h-8 text-xs bg-muted/30 border-border text-foreground"
                  />
                  {filteredDeps.length > 0 && (
                    <div className="max-h-36 overflow-y-auto space-y-1 border border-primary/20 rounded p-1 bg-muted/15">
                      {filteredDeps.slice(0, 8).map(t => (
                        <button
                          key={t.id}
                          className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-primary/10 text-left text-xs"
                          onClick={() => addDepMutation.mutate(t.id)}
                          disabled={addDepMutation.isPending}
                        >
                          <Badge className={`text-[10px] shrink-0 ${getStatusBadgeClass(t.status)}`}>
                            {getStatusLabel(t.status)}
                          </Badge>
                          <span className="truncate">
                            {t.ticketNumber && <span className="text-blue-400 font-mono mr-1">{t.ticketNumber}</span>}
                            {t.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {depSearch.trim().length > 1 && filteredDeps.length === 0 && (
                    <p className="text-xs text-muted-foreground/70">Nenhuma tarefa encontrada</p>
                  )}
                </div>
              </div>

              {/* Tags / Etiquetas */}
              <div className="bg-muted/30 p-4 rounded border border-border">
                <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <Tag className="size-4" /> Etiquetas
                </h4>

                <div className="flex flex-wrap gap-1.5 mb-3 min-h-[24px]">
                  {(task.tags || []).length === 0 ? (
                    <span className="text-xs text-muted-foreground/70">Nenhuma etiqueta</span>
                  ) : (
                    (task.tags || []).map(tag => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: tag.color + '33', color: tag.color, border: `1px solid ${tag.color}55` }}
                      >
                        {tag.name}
                        <button
                          onClick={() => removeTagMutation.mutate(tag.id)}
                          disabled={removeTagMutation.isPending}
                          className="ml-0.5 hover:opacity-70 transition-opacity"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {(() => {
                  const currentTagIds = new Set((task.tags || []).map(t => t.id));
                  const available = (allTags as TagType[]).filter(t => !currentTagIds.has(t.id));
                  return (
                    <div className="flex flex-wrap gap-2 items-center">
                      {available.length > 0 && (
                        <Select
                          value=""
                          onValueChange={v => { if (v) addTagMutation.mutate(v); }}
                          disabled={addTagMutation.isPending}
                        >
                          <SelectTrigger className="h-8 text-xs bg-muted/30 border-border w-48">
                            <Plus className="size-3 mr-1" />
                            <SelectValue placeholder="Adicionar etiqueta..." />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {available.map(t => (
                              <SelectItem key={t.id} value={t.id}>
                                <span className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: t.color }} />
                                  {t.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-muted-foreground hover:text-primary"
                          onClick={() => setShowNewTag(v => !v)}
                        >
                          <Plus className="size-3 mr-1" />
                          Nova etiqueta
                        </Button>
                      )}
                    </div>
                  );
                })()}

                {showNewTag && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <Input
                      placeholder="Nome da etiqueta"
                      value={newTagName}
                      onChange={e => setNewTagName(e.target.value)}
                      className="h-8 text-xs bg-muted/30 border-border text-foreground w-40"
                    />
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={e => setNewTagColor(e.target.value)}
                      className="w-8 h-8 rounded border border-primary/30 cursor-pointer bg-transparent"
                      title="Cor da etiqueta"
                    />
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      disabled={!newTagName.trim() || createTagMutation.isPending}
                      onClick={() => createTagMutation.mutate()}
                    >
                      Criar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-muted-foreground"
                      onClick={() => setShowNewTag(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>

              {/* Subtasks */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="bg-muted/30 p-4 rounded border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                      <CheckSquare className="size-4" />
                      Subtarefas ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})
                    </h4>
                    <span className="text-xs text-muted-foreground">{calculateProgress()}%</span>
                  </div>
                  <Progress value={calculateProgress()} className="mb-3 h-1.5" />
                  <div className="space-y-1.5">
                    {task.subtasks.map(subtask => (
                      <div key={subtask.id} className="flex items-center gap-2 p-2 rounded bg-muted/15 border border-primary/10 text-sm">
                        <input
                          type="checkbox"
                          checked={!!subtask.completed}
                          readOnly
                          className="size-4 rounded border-primary/50"
                        />
                        <span className={subtask.completed ? 'line-through text-muted-foreground/70' : ''}>
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Board badge */}
              {task.board && (
                <div className="flex gap-2 flex-wrap">
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                    Quadro: {task.board.name}
                  </Badge>
                </div>
              )}

              {/* Metadata */}
              <div className="bg-muted/30 p-3 rounded border border-border text-xs text-muted-foreground space-y-1">
                <p>Criado por: <span className="text-foreground">{task.creator.firstName} {task.creator.lastName || task.creator.email}</span></p>
                <p>Criado em: <span className="text-foreground">{new Date(task.createdAt || new Date()).toLocaleDateString('pt-BR')} às {new Date(task.createdAt || new Date()).toLocaleTimeString('pt-BR')}</span></p>
                <p>Atualizado: {formatDistanceToNow(new Date(task.updatedAt || new Date()), { addSuffix: true, locale: ptBR })}</p>
              </div>
            </TabsContent>

            <TabsContent value="comments" className="mt-5">
              <TaskComments taskId={task.id} />
            </TabsContent>

            <TabsContent value="history" className="mt-5">
              <TaskAuditLog taskId={task.id} />
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
