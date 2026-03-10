import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskWithDetails } from "@shared/schema";

export default function PriorityTasks() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });

  if (isLoading) {
    return (
      <Card className="bg-card border-border" data-testid="priority-tasks-loading">
        <CardHeader>
          <CardTitle>Tarefas Prioritárias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-muted rounded"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Filter and sort priority tasks (critical = urgent + important), excluding done tasks
  const priorityTasks = (tasks as any)?.filter((task: TaskWithDetails) => {
    if (task.status === 'done') return false;
    const isCritical = task.urgency === 'critical' && task.importance === 'high';
    const isUrgent = task.urgency === 'high' || task.urgency === 'critical';
    const isComplex = task.complexity === 'complex';
    return isCritical || isUrgent || isComplex;
  }).slice(0, 5) || [];

  const getTaskPulseClass = (task: TaskWithDetails) => {
    if (task.urgency === 'critical' && task.importance === 'high') return 'pulse-critical';
    if (task.urgency === 'high' || task.urgency === 'critical') return 'pulse-urgent';
    if (task.complexity === 'complex') return 'pulse-complex';
    return '';
  };

  const getPriorityBadge = (task: TaskWithDetails) => {
    if (task.urgency === 'critical' && task.importance === 'high') {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">CRÍTICO</Badge>;
    }
    if (task.urgency === 'high' || task.urgency === 'critical') {
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">URGENTE</Badge>;
    }
    if (task.importance === 'high') {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">IMPORTANTE</Badge>;
    }
    if (task.complexity === 'complex') {
      return <Badge className="bg-secondary/20 text-secondary border-secondary/50">COMPLEXA</Badge>;
    }
    return null;
  };

  const formatDeadline = (dueDate: Date | string | null) => {
    if (!dueDate) return "Sem prazo";
    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((dateDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Amanhã";
    if (diffDays < 0) return "Atrasado";
    if (diffDays <= 7) return `${diffDays} dias`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Card className="bg-card border-border" data-testid="priority-tasks">
      <CardHeader>
        <CardTitle>Tarefas Prioritárias</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {priorityTasks.length === 0 ? (
          <div className="text-center py-8" data-testid="no-priority-tasks">
            <p className="text-muted-foreground">Nenhuma tarefa prioritária encontrada</p>
          </div>
        ) : (
          priorityTasks.map((task: TaskWithDetails) => (
            <div
              key={task.id}
              className={cn(
                "bg-background border rounded p-3",
                getTaskPulseClass(task),
                task.urgency === 'critical' && task.importance === 'high' 
                  ? "border-red-500/50" 
                  : task.urgency === 'high' || task.urgency === 'critical'
                  ? "border-orange-500/50"
                  : "border-secondary/50"
              )}
              data-testid={`priority-task-${task.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium mb-1" data-testid={`task-title-${task.id}`}>
                    {task.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2" data-testid={`task-assignee-${task.id}`}>
                    Responsável: {task.assignee 
                      ? `${task.assignee.firstName || ''} ${task.assignee.lastName || ''}`.trim() || task.assignee.email
                      : 'Não atribuído'}
                  </p>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(task)}
                    {task.urgency === 'high' && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">URGENTE</Badge>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground" data-testid={`task-deadline-${task.id}`}>
                  Prazo: {formatDeadline(task.dueDate)}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
