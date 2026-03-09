import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertTaskSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import type { User, Board, TeamWithMembers } from "@shared/schema";

const taskFormSchema = insertTaskSchema
  .omit({ creatorId: true })
  .extend({
    assigneeId: z.union([z.literal("self"), z.string()]).optional(),
    startDate: z.preprocess(v => (typeof v === 'string' && v ? new Date(v) : v ?? null), z.date().nullable().optional()),
    dueDate: z.preprocess(v => (typeof v === 'string' && v ? new Date(v) : v ?? null), z.date().nullable().optional()),
    ticketNumber: z.string().optional(),
    teamId: z.string().optional(),
    boardId: z.string().optional(),
  });

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskModalProps {
  defaultTeamId?: string;
  defaultBoardId?: string;
}

export default function TaskModal({ defaultTeamId, defaultBoardId }: TaskModalProps) {
  const [open, setOpen] = useState(false);
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

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      await apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Tarefa criada com sucesso!" });
      setOpen(false);
      form.reset();
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
    const assigneeUsers = watchedTeamId ? teamMembers : allUsers as User[];
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium hover:bg-primary/90 transition-colors neon-glow"
          data-testid="button-new-task"
        >
          + Nova Tarefa
        </Button>
      </DialogTrigger>
      <DialogContent
        className="bg-card border border-primary/30 neon-glow w-full max-w-2xl max-h-[90vh] overflow-auto"
        data-testid="task-modal"
      >
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
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
                      <FormLabel>Título da Tarefa</FormLabel>
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
                  <FormLabel>Descrição</FormLabel>
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
                    <FormLabel>Equipe</FormLabel>
                    <Select
                      onValueChange={v => {
                        field.onChange(v === "_none" ? "" : v);
                        form.setValue("boardId", "");
                        form.setValue("assigneeId", "self");
                      }}
                      value={field.value || "_none"}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-input border-border focus:border-primary">
                          <SelectValue placeholder="Selecione uma equipe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">Sem equipe</SelectItem>
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
                    <FormLabel>Quadro</FormLabel>
                    <Select
                      onValueChange={v => field.onChange(v === "_none" ? "" : v)}
                      value={field.value || "_none"}
                      disabled={!watchedTeamId}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-input border-border focus:border-primary">
                          <SelectValue placeholder={watchedTeamId ? "Selecione um quadro" : "Selecione equipe primeiro"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">Sem quadro</SelectItem>
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
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="bg-input border-border focus:border-primary"
                        data-testid="input-start-date"
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={e => field.onChange(e.target.value ? new Date(e.target.value) : null)}
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
                    <FormLabel>Data de Entrega</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="bg-input border-border focus:border-primary"
                        data-testid="input-due-date"
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={e => field.onChange(e.target.value ? new Date(e.target.value) : null)}
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
    </Dialog>
  );
}
