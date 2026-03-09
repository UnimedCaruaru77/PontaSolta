import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import TaskCard from "./task-card";
import { TaskDetailsModal } from "./task-details-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Layout, Users } from "lucide-react";
import type { TaskWithDetails, TeamWithMembers, Board } from "@shared/schema";

export default function KanbanBoard() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');
  const urlBoardId = params.get('boardId') || '';
  const urlTeamId = params.get('teamId') || '';

  const [selectedTeamId, setSelectedTeamId] = useState(urlTeamId);
  const [selectedBoardId, setSelectedBoardId] = useState(urlBoardId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: teams = [] } = useQuery<TeamWithMembers[]>({
    queryKey: ["/api/teams"],
  });

  const { data: boards = [] } = useQuery<Board[]>({
    queryKey: ["/api/boards", selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return [];
      const res = await fetch(`/api/teams/${selectedTeamId}/boards`, { credentials: 'include' });
      return res.json();
    },
    enabled: !!selectedTeamId,
  });

  const taskQueryKey = selectedBoardId
    ? [`/api/tasks?boardId=${selectedBoardId}`]
    : selectedTeamId
    ? [`/api/tasks?teamId=${selectedTeamId}`]
    : ["/api/tasks"];

  const { data: tasks, isLoading } = useQuery<TaskWithDetails[]>({
    queryKey: taskQueryKey,
    queryFn: async () => {
      const qs = selectedBoardId
        ? `boardId=${selectedBoardId}`
        : selectedTeamId
        ? `teamId=${selectedTeamId}`
        : '';
      const res = await fetch(`/api/tasks${qs ? '?' + qs : ''}`, { credentials: 'include' });
      return res.json();
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: taskQueryKey });
      queryClient.refetchQueries({ queryKey: taskQueryKey });
      toast({ title: "Tarefa movida com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao mover tarefa.", variant: "destructive" });
    },
  });

  const columns = [
    { id: "todo", title: "A Fazer", status: "todo", color: "bg-muted text-muted-foreground", border: "border-l-muted" },
    { id: "in_progress", title: "Em Progresso", status: "in_progress", color: "bg-primary/20 text-primary", border: "border-l-primary" },
    { id: "review", title: "Em Revisão", status: "review", color: "bg-yellow-500/20 text-yellow-400", border: "border-l-yellow-500" },
    { id: "done", title: "Concluído", status: "done", color: "bg-secondary/20 text-secondary", border: "border-l-secondary" },
  ];

  const getTasksByStatus = (status: string) =>
    (tasks as TaskWithDetails[])?.filter(t => t.status === status) || [];

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      updateTaskMutation.mutate({ id: taskId, data: { status: newStatus } });
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.add('ring-2', 'ring-primary/50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove('ring-2', 'ring-primary/50');
  };

  return (
    <>
      {/* Board Selector Bar */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="size-4" />
          <span className="text-sm font-medium">Equipe:</span>
        </div>
        <Select
          value={selectedTeamId || "_all"}
          onValueChange={(v) => {
            setSelectedTeamId(v === "_all" ? "" : v);
            setSelectedBoardId("");
          }}
        >
          <SelectTrigger className="w-52 bg-input border-border h-9">
            <SelectValue placeholder="Todas as equipes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todas as equipes</SelectItem>
            {(teams as TeamWithMembers[]).map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedTeamId && (
          <>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Layout className="size-4" />
              <span className="text-sm font-medium">Quadro:</span>
            </div>
            <Select
              value={selectedBoardId || "_all"}
              onValueChange={(v) => setSelectedBoardId(v === "_all" ? "" : v)}
            >
              <SelectTrigger className="w-52 bg-input border-border h-9">
                <SelectValue placeholder="Todos os quadros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos os quadros</SelectItem>
                {(boards as Board[]).map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        {selectedBoardId && (
          <Badge className="bg-primary/20 text-primary border-primary/30 ml-auto">
            {(boards as Board[]).find(b => b.id === selectedBoardId)?.name}
          </Badge>
        )}
      </div>

      {/* Kanban Columns */}
      {isLoading ? (
        <div className="flex space-x-6 overflow-x-auto" data-testid="kanban-loading">
          {columns.map(col => (
            <div key={col.id} className="flex-shrink-0 w-72">
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{col.title}</CardTitle>
                    <div className="w-8 h-6 bg-muted rounded animate-pulse" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 min-h-[400px]">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-28 bg-muted rounded animate-pulse" />
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex space-x-4 overflow-x-auto pb-6" data-testid="kanban-board">
          {columns.map(column => {
            const columnTasks = getTasksByStatus(column.status);
            return (
              <div key={column.id} className="flex-shrink-0 w-72">
                <Card className={`bg-card border-border border-l-4 ${column.border}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">{column.title}</CardTitle>
                      <Badge className={`${column.color} text-xs`} data-testid={`column-count-${column.status}`}>
                        {columnTasks.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent
                    className="space-y-2 min-h-[400px] transition-all"
                    onDragOver={handleDragOver}
                    onDrop={e => { handleDrop(e, column.status); handleDragLeave(e); }}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    data-testid={`column-${column.status}`}
                  >
                    {columnTasks.length === 0 ? (
                      <div
                        className="text-center py-12 text-muted-foreground/50 text-sm border-2 border-dashed border-border rounded-lg"
                        data-testid={`empty-column-${column.status}`}
                      >
                        Arraste um card aqui
                      </div>
                    ) : (
                      columnTasks.map(task => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={e => handleDragStart(e, task.id)}
                          onClick={() => setSelectedTaskId(task.id)}
                          className="cursor-pointer"
                          data-testid={`kanban-task-${task.id}`}
                        >
                          <TaskCard task={task} />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      <TaskDetailsModal
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onOpenChange={open => !open && setSelectedTaskId(null)}
      />
    </>
  );
}
