import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertTaskSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toLocalNoon } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { LayoutTemplate, Share2, Plus, X, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import type { User, Board, TeamWithMembers, TaskTemplate } from "@shared/schema";

type PendingShare = { teamId: string; assigneeId: string | null };

const taskFormSchema = insertTaskSchema
  .omit({ creatorId: true })
  .extend({
    title: z.string().min(1, "Título é obrigatório"),
    description: z.string().min(1, "Descrição é obrigatória"),
    teamId: z.string().min(1, "Equipe é obrigatória"),
    boardId: z.string().min(1, "Quadro é obrigatório"),
    assigneeId: z.union([z.literal("self"), z.string().min(1)]),
    startDate: z.preprocess(
      v => (typeof v === 'string' && v) || v instanceof Date ? toLocalNoon(v as string | Date) : null,
      z.date({ required_error: "Data de início é obrigatória", invalid_type_error: "Data de início é obrigatória" })
    ),
    dueDate: z.preprocess(
      v => (typeof v === 'string' && v) || v instanceof Date ? toLocalNoon(v as string | Date) : null,
      z.date({ required_error: "Data de entrega é obrigatória", invalid_type_error: "Data de entrega é obrigatória" })
    ),
    ticketNumber: z.string().optional(),
  });

type TaskFormData = z.infer<typeof taskFormSchema>;

export interface InitialTaskData {
  title?: string;
  description?: string;
  startDate?: Date | null;
  dueDate?: Date | null;
  teamId?: string;
}

interface TaskModalProps {
  defaultTeamId?: string;
  defaultBoardId?: string;
  controlledOpen?: boolean;
  onControlledOpenChange?: (open: boolean) => void;
  initialData?: InitialTaskData;
}

export default function TaskModal({ defaultTeamId, defaultBoardId, controlledOpen, onControlledOpenChange, initialData }: TaskModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [pendingShares, setPendingShares] = useState<PendingShare[]>([]);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => { onControlledOpenChange?.(v); if (!v) setPendingShares([]); }
    : (v: boolean) => { setInternalOpen(v); if (!v) setPendingShares([]); };

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: teams = [] } = useQuery<TeamWithMembers[]>({
    queryKey: ["/api/teams"],
    enabled: open,
  });

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      urgency: "medium",
      importance: "medium",
      complexity: "medium",
      status: "todo",
      assigneeId: "self",
      ticketNumber: "",
      teamId: defaultTeamId || "",
      boardId: defaultBoardId || "",
      startDate: toLocalNoon(new Date()) as Date,
    },
  });

  const watchedTeamId = form.watch("teamId");

  const { data: teamBoards = [] } = useQuery<Board[]>({
    queryKey: ["/api/boards", watchedTeamId],
    queryFn: async () => {
      if (!watchedTeamId) return [];
      const res = await fetch(`/api/teams/${watchedTeamId}/boards`, { credentials: 'include' });
      return res.json();
    },
    enabled: open && !!watchedTeamId,
  });

  const { data: teamMembers = [] } = useQuery<User[]>({
    queryKey: ["/api/teams", watchedTeamId, "members"],
    queryFn: async () => {
      if (!watchedTeamId) return [];
      const res = await fetch(`/api/teams/${watchedTeamId}/members`, { credentials: 'include' });
      return res.json();
    },
    enabled: open && !!watchedTeamId,
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: open,
  });

  const { data: templates = [] } = useQuery<TaskTemplate[]>({
    queryKey: ["/api/task-templates", watchedTeamId],
    queryFn: async () => {
      const url = watchedTeamId
        ? `/api/task-templates?teamId=${watchedTeamId}`
        : "/api/task-templates";
      const res = await fetch(url, { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: open,
  });

  useEffect(() => {
    if (open && initialData) {
      form.reset({
        title: initialData.title || "",
        description: initialData.description || "",
        priority: "medium",
        urgency: "medium",
        importance: "medium",
        complexity: "medium",
        status: "todo",
        assigneeId: "self",
        ticketNumber: "",
        teamId: initialData.teamId || defaultTeamId || "",
        boardId: defaultBoardId || "",
        startDate: initialData.startDate ?? (toLocalNoon(new Date()) as Date),
        dueDate: initialData.dueDate ?? undefined,
      });
    }
  }, [open]);

  const applyTemplate = (tmpl: TaskTemplate) => {
    form.setValue("title", tmpl.title);
    if (tmpl.description) form.setValue("description", tmpl.description);
    if (tmpl.priority) form.setValue("priority", tmpl.priority as any);
    if (tmpl.urgency) form.setValue("urgency", tmpl.urgency as any);
    if (tmpl.importance) form.setValue("importance", tmpl.importance as any);
    if (tmpl.complexity) form.setValue("complexity", tmpl.complexity as any);
    setTemplateDialogOpen(false);
    toast({ title: `Template "${tmpl.title}" aplicado` });
  };

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const res = await apiRequest("POST", "/api/tasks", data);
      const task = await res.json();
      for (const share of pendingShares) {
        await apiRequest("POST", `/api/tasks/${task.id}/shares`, { teamId: share.teamId });
        if (share.assigneeId) {
          await apiRequest("PATCH", `/api/tasks/${task.id}/shares/${share.teamId}`, { assigneeId: share.assigneeId });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Tarefa criada com sucesso!" });
      setOpen(false);
      form.reset();
      setPendingShares([]);
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao criar tarefa.", variant: "destructive" });
    },
  });

  const onSubmit = (data: TaskFormData) => {
    if (!user?.id) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    const payload = {
      ...data,
      creatorId: user.id,
      assigneeId: data.assigneeId === "self" ? user.id : data.assigneeId || null,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      ticketNumber: data.ticketNumber || null,
      teamId: data.teamId || null,
      boardId: data.boardId || null,
    };
    createTaskMutation.mutate(payload as any);
  };

  const assigneeOptions = watchedTeamId ? (teamMembers as User[]) : (allUsers as User[]);

  const dialogContent = (
    <DialogContent
      className="bg-card border border-primary/30 neon-glow w-full max-w-2xl max-h-[90vh] overflow-auto"
      data-testid="task-modal"
    >
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle>Nova Tarefa</DialogTitle>
          {templates.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={() => setTemplateDialogOpen(true)}
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              Usar Template
            </Button>
          )}
        </div>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Title + Ticket Number */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título da Tarefa *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o título da tarefa"
                        className="bg-input border-border focus:border-primary"
                        data-testid="input-task-title"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="ticketNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>N° Chamado</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="INC-001"
                      className="bg-input border-border focus:border-primary font-mono"
                      data-testid="input-ticket-number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição *</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Descreva os detalhes da tarefa..."
                    className="bg-input border-border focus:border-primary resize-none"
                    data-testid="textarea-description"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Team + Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="teamId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipe *</FormLabel>
                  <Select
                    onValueChange={v => {
                      field.onChange(v);
                      form.setValue("boardId", "");
                      form.setValue("assigneeId", "self");
                    }}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-input border-border focus:border-primary">
                        <SelectValue placeholder="Selecione uma equipe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(teams as TeamWithMembers[]).map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="boardId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quadro *</FormLabel>
                  <Select
                    onValueChange={v => field.onChange(v)}
                    value={field.value || ""}
                    disabled={!watchedTeamId}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-input border-border focus:border-primary">
                        <SelectValue placeholder={watchedTeamId ? "Selecione um quadro" : "Selecione equipe primeiro"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(teamBoards as Board[]).map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Assignee */}
          <FormField
            control={form.control}
            name="assigneeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsável</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "self"}>
                  <FormControl>
                    <SelectTrigger className="bg-input border-border focus:border-primary" data-testid="select-assignee">
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="self">Eu mesmo</SelectItem>
                    {assigneeOptions
                      .filter((u: User) => u.id !== user?.id)
                      .map((u: User) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName && u.lastName
                            ? `${u.firstName} ${u.lastName}`
                            : u.email}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Shared Responsibility */}
          {watchedTeamId && (
            <div className="bg-muted p-4 rounded border border-border">
              <h4 className="text-sm font-semibold text-primary mb-1 flex items-center gap-2">
                <Share2 className="size-4" /> Responsabilidade Compartilhada
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                Adicione equipes co-responsáveis antes de criar a tarefa.
              </p>

              {/* Pending shared teams list */}
              {pendingShares.length > 0 && (
                <div className="space-y-2 mb-3">
                  {pendingShares.map(share => {
                    const teamObj = (teams as TeamWithMembers[]).find(t => t.id === share.teamId);
                    if (!teamObj) return null;
                    const members: User[] = teamObj.members || [];
                    const assignee = members.find(m => m.id === share.assigneeId);
                    return (
                      <div key={share.teamId} className="bg-background rounded border border-border/50 p-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                            <Users className="size-3 mr-1" />
                            {teamObj.name}{share.teamId === watchedTeamId ? " (mesma equipe)" : ""}
                          </Badge>
                          <button
                            type="button"
                            onClick={() => setPendingShares(prev => prev.filter(s => s.teamId !== share.teamId))}
                            className="text-muted-foreground/70 hover:text-red-400 transition-colors"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          {assignee && (
                            <Avatar className="size-5">
                              <AvatarImage src={assignee.profileImageUrl || undefined} />
                              <AvatarFallback className="text-[10px] bg-blue-500/20 text-blue-300">
                                {assignee.firstName?.[0]}{assignee.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <Select
                            value={share.assigneeId || "none"}
                            onValueChange={v => setPendingShares(prev =>
                              prev.map(s => s.teamId === share.teamId ? { ...s, assigneeId: v === 'none' ? null : v } : s)
                            )}
                          >
                            <SelectTrigger className="h-7 text-[11px] bg-muted border-border flex-1">
                              <SelectValue placeholder="Atribuir responsável..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem responsável</SelectItem>
                              {members.map(m => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : m.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add team to share */}
              {(teams as TeamWithMembers[]).filter(t => !pendingShares.some(s => s.teamId === t.id)).length > 0 && (
                <Select
                  value=""
                  onValueChange={v => { if (v) setPendingShares(prev => [...prev, { teamId: v, assigneeId: null }]); }}
                >
                  <SelectTrigger className="h-8 text-xs bg-muted border-border">
                    <Plus className="size-3 mr-1" />
                    <SelectValue placeholder="Adicionar equipe..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(teams as TeamWithMembers[])
                      .filter(t => !pendingShares.some(s => s.teamId === t.id))
                      .map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}{t.id === watchedTeamId ? " (mesma equipe)" : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Priority, Urgency, Importance, Complexity */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-input border-border" data-testid="select-priority">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="urgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Urgência</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-input border-border" data-testid="select-urgency">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="importance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Importância</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-input border-border" data-testid="select-importance">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="complexity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complexidade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-input border-border" data-testid="select-complexity">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="simple">Simples</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="complex">Complexa</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Início *</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value ?? null}
                      onChange={field.onChange}
                      placeholder="Selecionar data de início"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Entrega *</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value ?? null}
                      onChange={field.onChange}
                      placeholder="Selecionar data de entrega"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} data-testid="button-cancel">
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow"
              disabled={createTaskMutation.isPending}
              data-testid="button-create-task"
            >
              {createTaskMutation.isPending ? "Criando..." : "Criar Tarefa"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button
            className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium hover:bg-primary/90 transition-colors neon-glow"
            data-testid="button-new-task"
          >
            + Nova Tarefa
          </Button>
        </DialogTrigger>
      )}
      {dialogContent}
    </Dialog>

    {/* Template selection dialog */}
    <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Selecionar Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum template disponível.</p>
          ) : (
            templates.map(tmpl => (
              <div
                key={tmpl.id}
                className="flex items-start gap-3 p-3 border border-border/50 rounded-lg hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-colors"
                onClick={() => applyTemplate(tmpl)}
              >
                <LayoutTemplate className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{tmpl.title}</p>
                  {tmpl.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tmpl.description}</p>}
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{tmpl.priority}</Badge>
                    <Badge variant="outline" className="text-[10px]">{tmpl.complexity}</Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
