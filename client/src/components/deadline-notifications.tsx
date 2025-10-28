import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Bell, CheckCircle2, XCircle } from "lucide-react";
import { differenceInDays, differenceInHours, formatDistanceToNow, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TaskWithDetails } from "@shared/schema";

export default function DeadlineNotifications() {
  const { data: tasks, isLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ["/api/tasks"],
  });

  const getUrgentTasks = () => {
    if (!tasks) return { overdue: [], today: [], thisWeek: [] };
    
    const now = new Date();
    const overdue: TaskWithDetails[] = [];
    const today: TaskWithDetails[] = [];
    const thisWeek: TaskWithDetails[] = [];
    
    tasks.forEach(task => {
      if (!task.dueDate || task.status === 'done') return;
      
      const dueDate = new Date(task.dueDate);
      const daysUntilDue = differenceInDays(dueDate, now);
      
      if (isPast(dueDate)) {
        overdue.push(task);
      } else if (daysUntilDue === 0) {
        today.push(task);
      } else if (daysUntilDue > 0 && daysUntilDue <= 7) {
        thisWeek.push(task);
      }
    });
    
    return { 
      overdue: overdue.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()),
      today: today.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()),
      thisWeek: thisWeek.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    };
  };

  const urgentTasks = getUrgentTasks();
  const totalUrgent = urgentTasks.overdue.length + urgentTasks.today.length + urgentTasks.thisWeek.length;

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      default: return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      todo: 'A Fazer',
      in_progress: 'Em Progresso',
      review: 'Em Revisão',
      done: 'Concluído',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-black/60 to-black/40 border-primary/30">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-black/60 to-black/40 border-primary/30 shadow-lg shadow-primary/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Bell className="size-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Notificações de Prazos</h3>
            <p className="text-sm text-gray-400">
              {totalUrgent === 0 ? 'Nenhuma tarefa urgente' : `${totalUrgent} tarefa(s) requer(em) atenção`}
            </p>
          </div>
        </div>
        {totalUrgent > 0 && (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/50 animate-pulse">
            {totalUrgent}
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {/* Overdue Tasks */}
        {urgentTasks.overdue.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="size-4 text-red-400" />
              <h4 className="font-semibold text-red-400">Atrasadas ({urgentTasks.overdue.length})</h4>
            </div>
            {urgentTasks.overdue.map(task => (
              <div
                key={task.id}
                data-testid={`notification-overdue-${task.id}`}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 animate-pulse"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="size-4 text-red-400 flex-shrink-0" />
                      <span className="font-semibold text-white text-sm">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="size-3" />
                      <span>
                        Atrasada {formatDistanceToNow(new Date(task.dueDate!), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className={getPriorityColor(task.priority)}>
                    {getStatusLabel(task.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Today's Tasks */}
        {urgentTasks.today.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="size-4 text-orange-400" />
              <h4 className="font-semibold text-orange-400">Hoje ({urgentTasks.today.length})</h4>
            </div>
            {urgentTasks.today.map(task => (
              <div
                key={task.id}
                data-testid={`notification-today-${task.id}`}
                className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="size-4 text-orange-400 flex-shrink-0" />
                      <span className="font-semibold text-white text-sm">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>Vence hoje às {new Date(task.dueDate!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={getPriorityColor(task.priority)}>
                    {getStatusLabel(task.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* This Week's Tasks */}
        {urgentTasks.thisWeek.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="size-4 text-yellow-400" />
              <h4 className="font-semibold text-yellow-400">Esta Semana ({urgentTasks.thisWeek.length})</h4>
            </div>
            {urgentTasks.thisWeek.map(task => (
              <div
                key={task.id}
                data-testid={`notification-week-${task.id}`}
                className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Bell className="size-4 text-yellow-400 flex-shrink-0" />
                      <span className="font-semibold text-white text-sm">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>Vence {formatDistanceToNow(new Date(task.dueDate!), { addSuffix: true, locale: ptBR })}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={getPriorityColor(task.priority)}>
                    {getStatusLabel(task.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All clear */}
        {totalUrgent === 0 && (
          <div className="text-center py-8">
            <CheckCircle2 className="size-12 mx-auto mb-3 text-green-400" />
            <p className="text-gray-400 text-sm">
              Tudo sob controle! Nenhum prazo urgente no momento.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
