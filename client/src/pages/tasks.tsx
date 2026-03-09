import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { TaskDetailsModal } from "@/components/task-details-modal";
import { cn } from "@/lib/utils";
import type { TaskWithDetails } from "@shared/schema";

export default function Tasks() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"assigned" | "created" | "all">("assigned");
  const { user } = useAuth();

  const { data: allTasks, isLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ["/api/tasks"],
  });

  const filteredTasks = allTasks?.filter((task: TaskWithDetails) => {
    // Filter by view mode
    if (viewMode === "assigned" && task.assigneeId !== user?.id) return false;
    if (viewMode === "created" && task.creatorId !== user?.id) return false;
    
    // Filter by status
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    
    return true;
  }) || [];

  const getTaskPulseClass = (task: TaskWithDetails) => {
    if (task.urgency === 'critical' && task.importance === 'high') return 'pulse-critical';
    if (task.urgency === 'high' || task.urgency === 'critical') return 'pulse-urgent';
    if (task.complexity === 'complex') return 'pulse-complex';
    return '';
  };

  const getPriorityBadges = (task: TaskWithDetails) => {
    const badges = [];
    
    if (task.urgency === 'critical' && task.importance === 'high') {
      badges.push(
        <Badge key="critical" className="bg-red-500/20 text-red-400 border-red-500/50">
          CRÍTICO
        </Badge>
      );
    }
    if (task.urgency === 'high' || task.urgency === 'critical') {
      badges.push(
        <Badge key="urgent" className="bg-orange-500/20 text-orange-400 border-orange-500/50">
          URGENTE
        </Badge>
      );
    }
    if (task.importance === 'high') {
      badges.push(
        <Badge key="important" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
          IMPORTANTE
        </Badge>
      );
    }
    if (task.complexity === 'complex') {
      badges.push(
        <Badge key="complex" className="bg-secondary/20 text-secondary border-secondary/50">
          COMPLEXA
        </Badge>
      );
    }

    return badges;
  };

  const formatDeadline = (dueDate: Date | string | null) => {
    if (!dueDate) return "Sem prazo";
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Amanhã";
    if (diffDays < 0) return "Atrasado";
    if (diffDays <= 7) return `${diffDays} dias`;
    return date.toLocaleDateString();
  };

  const getCreatorName = (task: TaskWithDetails) => {
    const creator = task.creator;
    if (creator?.firstName && creator?.lastName) {
      return `${creator.firstName} ${creator.lastName}`;
    }
    return creator?.email || "Usuário";
  };

  const getAssigneeName = (task: TaskWithDetails) => {
    const assignee = task.assignee;
    if (!assignee) return "Não atribuído";
    if (assignee?.firstName && assignee?.lastName) {
      return `${assignee.firstName} ${assignee.lastName}`;
    }
    return assignee?.email || "Usuário";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-card border-border" data-testid="tasks-loading">
          <CardHeader>
            <div className="animate-pulse">
              <div className="h-6 bg-muted rounded w-48 mb-2"></div>
              <div className="h-4 bg-muted rounded w-96"></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded animate-pulse"></div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6" data-testid="tasks-page">
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Minhas Tarefas</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Gerencie suas tarefas e acompanhe o progresso
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                  <SelectTrigger className="w-40" data-testid="select-view-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assigned">Atribuídas a mim</SelectItem>
                    <SelectItem value="created">Criadas por mim</SelectItem>
                    <SelectItem value="all">Todas</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32" data-testid="select-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="todo">A Fazer</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="review">Em Revisão</SelectItem>
                    <SelectItem value="done">Concluídas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12" data-testid="no-tasks">
                  <p className="text-muted-foreground text-lg">
                    {statusFilter === "all" 
                      ? "Nenhuma tarefa encontrada" 
                      : `Nenhuma tarefa ${statusFilter === "todo" ? "a fazer" : 
                          statusFilter === "in_progress" ? "em progresso" :
                          statusFilter === "review" ? "em revisão" : "concluída"} encontrada`}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {viewMode === "assigned" ? "Você não tem tarefas atribuídas" :
                     viewMode === "created" ? "Você não criou nenhuma tarefa" :
                     "Não há tarefas disponíveis"}
                  </p>
                </div>
              ) : (
                filteredTasks.map((task: TaskWithDetails) => (
                  <div
                    key={task.id}
                    className={cn(
                      "bg-background border rounded p-4 cursor-pointer hover:border-primary/50 transition-colors",
                      getTaskPulseClass(task),
                      task.urgency === 'critical' && task.importance === 'high' 
                        ? "border-red-500/50" 
                        : task.urgency === 'high' || task.urgency === 'critical'
                        ? "border-orange-500/50"
                        : task.complexity === 'complex'
                        ? "border-secondary/50"
                        : "border-border"
                    )}
                    onClick={() => setSelectedTaskId(task.id)}
                    data-testid={`task-item-${task.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox 
                          checked={task.status === 'done'}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-border"
                          data-testid={`task-checkbox-${task.id}`}
                        />
                        <div className="flex-1">
                          <h4 
                            className={cn(
                              "font-medium mb-1",
                              task.status === 'done' && "line-through text-muted-foreground"
                            )}
                            data-testid={`task-title-${task.id}`}
                          >
                            {task.title}
                          </h4>
                          <div className="flex items-center text-sm text-muted-foreground space-x-4">
                            <span data-testid={`task-assignee-info-${task.id}`}>
                              {viewMode === "created" 
                                ? `Atribuída para: ${getAssigneeName(task)}`
                                : `Criada por: ${getCreatorName(task)}`}
                            </span>
                            <span data-testid={`task-deadline-info-${task.id}`}>
                              Prazo: {formatDeadline(task.dueDate)}
                            </span>
                            {task.subtasks.length > 0 && (
                              <span data-testid={`task-subtasks-info-${task.id}`}>
                                {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtarefas
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" data-testid={`task-badges-${task.id}`}>
                        {getPriorityBadges(task)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <TaskDetailsModal
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onOpenChange={(open) => { if (!open) setSelectedTaskId(null); }}
      />
    </>
  );
}
