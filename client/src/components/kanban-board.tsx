import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import TaskCard from "./task-card";
import { TaskDetailsModal } from "./task-details-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TaskWithDetails } from "@shared/schema";

export default function KanbanBoard() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      // Force refetch of all task-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.refetchQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Sucesso",
        description: "Tarefa movida com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao mover tarefa.",
        variant: "destructive",
      });
    },
  });

  const columns = [
    {
      id: "todo",
      title: "A Fazer",
      status: "todo",
      badgeColor: "bg-muted text-muted-foreground",
    },
    {
      id: "in_progress",
      title: "Em Progresso",
      status: "in_progress", 
      badgeColor: "bg-primary/20 text-primary",
    },
    {
      id: "review",
      title: "Em Revisão",
      status: "review",
      badgeColor: "bg-yellow-500/20 text-yellow-400",
    },
    {
      id: "done",
      title: "Concluído",
      status: "done",
      badgeColor: "bg-secondary/20 text-secondary",
    },
  ];

  const getTasksByStatus = (status: string) => {
    return (tasks as any)?.filter((task: TaskWithDetails) => task.status === status) || [];
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      updateTaskMutation.mutate({
        id: taskId,
        data: { status: newStatus },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex space-x-6 overflow-x-auto" data-testid="kanban-loading">
        {columns.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{column.title}</CardTitle>
                  <div className="w-8 h-6 bg-muted rounded animate-pulse"></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 min-h-[500px]">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex space-x-6 overflow-x-auto pb-6" data-testid="kanban-board">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.status);
          
          return (
            <div key={column.id} className="flex-shrink-0 w-80">
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{column.title}</CardTitle>
                    <Badge className={column.badgeColor} data-testid={`column-count-${column.status}`}>
                      {columnTasks.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent 
                  className="space-y-3 min-h-[500px]"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.status)}
                  data-testid={`column-${column.status}`}
                >
                  {columnTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground" data-testid={`empty-column-${column.status}`}>
                      Nenhuma tarefa
                    </div>
                  ) : (
                    columnTasks.map((task: TaskWithDetails) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => handleTaskClick(task.id)}
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

      <TaskDetailsModal
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
      />
    </>
  );
}
