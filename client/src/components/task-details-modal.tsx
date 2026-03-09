import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TaskComments } from "./task-comments";
import { TaskAuditLog } from "./task-audit-log";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Calendar, User, Clock, AlertTriangle, CheckSquare,
  MessageSquare, FileText, History, Hash, CheckCircle2, XCircle,
  Users, Share2, X, Plus, ArrowRightLeft
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TaskWithDetails, User as UserType, Team } from "@shared/schema";

interface TaskDetailsModalProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
  if (firstName) return firstName[0].toUpperCase();
  return "U";
}

export function TaskDetailsModal({ taskId, open, onOpenChange }: TaskDetailsModalProps) {
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

  if (!task && !isLoading) return null;

  const getPriorityColor = (p: string) =>
    p === 'high' ? 'text-red-400 bg-red-500/20 border-red-500/50' :
    p === 'medium' ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50' :
    'text-blue-400 bg-blue-500/20 border-blue-500/50';

  const getUrgencyColor = (u: string) =>
    u === 'critical' ? 'text-red-400 bg-red-500/20 border-red-500/50' :
    u === 'high' ? 'text-orange-400 bg-orange-500/20 border-orange-500/50' :
    u === 'medium' ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50' :
    'text-gray-400 bg-gray-500/20 border-gray-500/50';

  const calculateProgress = () => {
    if (!task || task.subtasks.length === 0) return 0;
    return Math.round((task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100);
  };

  // Teams not yet associated (neither owner nor shared)
  const currentSharedTeamIds = new Set((task?.sharedTeams || []).map(t => t.id));
  const availableToShare = (allTeams as Team[]).filter(
    t => t.id !== task?.teamId && !currentSharedTeamIds.has(t.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-2 border-primary/50 text-white">
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
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : task ? (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-black/40">
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
                <div className="bg-black/40 p-3 rounded border border-primary/20">
                  <p className="text-xs text-gray-400 mb-2">Status</p>
                  <Select
                    value={task.status}
                    onValueChange={v => updateMutation.mutate({ status: v })}
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger className="bg-primary/20 text-primary border-primary/50 hover:bg-primary/30 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-primary/50">
                      <SelectItem value="todo">A Fazer</SelectItem>
                      <SelectItem value="in_progress">Em Progresso</SelectItem>
                      <SelectItem value="review">Em Revisão</SelectItem>
                      <SelectItem value="done">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-black/40 p-3 rounded border border-primary/20">
                  <p className="text-xs text-gray-400 mb-2">Prioridade</p>
                  <Select
                    value={task.priority}
                    onValueChange={v => updateMutation.mutate({ priority: v })}
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger className={`h-8 text-xs border ${getPriorityColor(task.priority)}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-primary/50">
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-black/40 p-3 rounded border border-primary/20">
                  <p className="text-xs text-gray-400 mb-2">Urgência</p>
                  <Select
                    value={task.urgency}
                    onValueChange={v => updateMutation.mutate({ urgency: v })}
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger className={`h-8 text-xs border ${getUrgencyColor(task.urgency)}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-primary/50">
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-black/40 p-3 rounded border border-primary/20">
                  <p className="text-xs text-gray-400 mb-2">Complexidade</p>
                  <Select
                    value={task.complexity}
                    onValueChange={v => updateMutation.mutate({ complexity: v })}
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger className="h-8 text-xs bg-black/40 border-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-primary/50">
                      <SelectItem value="simple">Simples</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="complex">Complexa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Finish / Reopen quick actions */}
              <div className="flex gap-2">
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
                <div className="bg-black/40 p-4 rounded border border-primary/20">
                  <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                    <FileText className="size-4" /> Descrição
                  </h4>
                  <p className="text-gray-300 whitespace-pre-wrap text-sm">{task.description}</p>
                </div>
              )}

              {/* Assignee + Dates */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-black/40 p-4 rounded border border-primary/20">
                  <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <User className="size-4" /> Responsável
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
                          <p className="text-xs text-gray-400">{task.assignee.email}</p>
                        </div>
                      </div>
                    )}
                    <Select
                      value={task.assigneeId || "none"}
                      onValueChange={v => updateMutation.mutate({ assigneeId: v === 'none' ? null : v })}
                      disabled={updateMutation.isPending}
                    >
                      <SelectTrigger className="h-8 text-xs bg-black/40 border-primary/30">
                        <SelectValue placeholder="Alterar responsável..." />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-primary/50">
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

                <div className="bg-black/40 p-4 rounded border border-primary/20 space-y-2">
                  <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                    <Calendar className="size-4" /> Prazos
                  </h4>
                  {task.startDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="size-4 text-gray-400" />
                      <span className="text-gray-400">Início:</span>
                      <span>{new Date(task.startDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="size-4 text-orange-400" />
                      <span className="text-gray-400">Prazo:</span>
                      <span className={new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-red-400 font-semibold' : ''}>
                        {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {task.completedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-green-400" />
                      <span className="text-gray-400">Concluído em:</span>
                      <span className="text-green-400">{new Date(task.completedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  {!task.startDate && !task.dueDate && (
                    <p className="text-gray-500 text-xs">Nenhum prazo definido</p>
                  )}
                </div>
              </div>

              {/* Team Transfer + Sharing */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Transfer team */}
                <div className="bg-black/40 p-4 rounded border border-primary/20">
                  <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <ArrowRightLeft className="size-4" /> Equipe Responsável
                  </h4>
                  <p className="text-xs text-gray-400 mb-3">
                    Transferir para outra equipe remove o responsável e o quadro atual, mantendo todos os demais dados.
                  </p>
                  <Select
                    value={task.teamId || "none"}
                    onValueChange={v => {
                      const newTeamId = v === 'none' ? null : v;
                      updateMutation.mutate({ teamId: newTeamId, assigneeId: null, boardId: null });
                    }}
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger className="h-8 text-xs bg-black/40 border-primary/30">
                      <SelectValue placeholder="Sem equipe" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-primary/50">
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

                {/* Share with teams */}
                <div className="bg-black/40 p-4 rounded border border-primary/20">
                  <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <Share2 className="size-4" /> Compartilhar com Equipes
                  </h4>
                  <p className="text-xs text-gray-400 mb-3">
                    Compartilhe o mérito desta entrega com outras equipes.
                  </p>

                  {/* Current shared teams */}
                  <div className="flex flex-wrap gap-1.5 mb-3 min-h-[24px]">
                    {(task.sharedTeams || []).length === 0 ? (
                      <span className="text-xs text-gray-500">Nenhuma equipe ainda</span>
                    ) : (
                      (task.sharedTeams || []).map(t => (
                        <Badge
                          key={t.id}
                          className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs pr-1 flex items-center gap-1"
                        >
                          <Users className="size-3" />
                          {t.name}
                          <button
                            onClick={() => unshareMutation.mutate(t.id)}
                            disabled={unshareMutation.isPending}
                            className="ml-1 hover:text-red-400 transition-colors"
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>

                  {/* Add new team to share */}
                  {availableToShare.length > 0 && (
                    <Select
                      value=""
                      onValueChange={v => { if (v) shareMutation.mutate(v); }}
                      disabled={shareMutation.isPending}
                    >
                      <SelectTrigger className="h-8 text-xs bg-black/40 border-primary/30">
                        <Plus className="size-3 mr-1" />
                        <SelectValue placeholder="Adicionar equipe..." />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-primary/50">
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

              {/* Subtasks */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="bg-black/40 p-4 rounded border border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                      <CheckSquare className="size-4" />
                      Subtarefas ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})
                    </h4>
                    <span className="text-xs text-gray-400">{calculateProgress()}%</span>
                  </div>
                  <Progress value={calculateProgress()} className="mb-3 h-1.5" />
                  <div className="space-y-1.5">
                    {task.subtasks.map(subtask => (
                      <div key={subtask.id} className="flex items-center gap-2 p-2 rounded bg-black/20 border border-primary/10 text-sm">
                        <input
                          type="checkbox"
                          checked={!!subtask.completed}
                          readOnly
                          className="size-4 rounded border-primary/50"
                        />
                        <span className={subtask.completed ? 'line-through text-gray-500' : ''}>
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
              <div className="bg-black/40 p-3 rounded border border-primary/20 text-xs text-gray-400 space-y-1">
                <p>Criado por: <span className="text-white">{task.creator.firstName} {task.creator.lastName || task.creator.email}</span></p>
                <p>Criado em: <span className="text-white">{new Date(task.createdAt || new Date()).toLocaleDateString('pt-BR')} às {new Date(task.createdAt || new Date()).toLocaleTimeString('pt-BR')}</span></p>
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
