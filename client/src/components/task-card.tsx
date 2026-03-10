import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TaskWithDetails } from "@shared/schema";

interface TaskCardProps {
  task: TaskWithDetails;
}

export default function TaskCard({ task }: TaskCardProps) {
  const getPulseClass = () => {
    if (task.urgency === 'critical' && task.importance === 'high') return 'pulse-critical';
    if (task.urgency === 'high' || task.urgency === 'critical') return 'pulse-urgent';
    if (task.complexity === 'complex') return 'pulse-complex';
    return '';
  };

  const getBorderClass = () => {
    if (task.urgency === 'critical' && task.importance === 'high') return 'border-red-500/50';
    if (task.urgency === 'high' || task.urgency === 'critical') return 'border-orange-500/50';
    if (task.complexity === 'complex') return 'border-secondary/50';
    return 'border-border';
  };

  const getPriorityBadge = () => {
    if (task.urgency === 'critical' && task.importance === 'high') {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/50 text-[10px] px-1.5 py-0">CRÍTICO</Badge>;
    }
    if (task.urgency === 'high' || task.urgency === 'critical') {
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50 text-[10px] px-1.5 py-0">URGENTE</Badge>;
    }
    if (task.importance === 'high') {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-[10px] px-1.5 py-0">ALTA</Badge>;
    }
    if (task.complexity === 'complex') {
      return <Badge className="bg-secondary/20 text-secondary border-secondary/50 text-[10px] px-1.5 py-0">COMPLEXA</Badge>;
    }
    return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 text-[10px] px-1.5 py-0">MÉDIA</Badge>;
  };

  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
    if (firstName && lastName) return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return "U";
  };

  const getUserName = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (email) return email;
    return "Não atribuído";
  };

  const formatDueDate = (dueDate: Date | string | null) => {
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

  const calculateProgress = () => {
    if (task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(st => st.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  };

  const getSlaInfo = () => {
    if (!task.ticketNumber || !task.dueDate) return null;
    const start = task.startDate ? new Date(task.startDate) : new Date(task.createdAt!);
    const end = new Date(task.dueDate);
    const now = new Date();
    const total = end.getTime() - start.getTime();
    if (total <= 0) return null;
    const elapsed = now.getTime() - start.getTime();
    const remainingPct = Math.max(0, Math.min(100, (1 - elapsed / total) * 100));

    if (now > end) return { pct: 0, barColor: 'bg-red-500', label: 'SLA vencido' };
    if (remainingPct > 50) return { pct: remainingPct, barColor: 'bg-green-500', label: `SLA: ${Math.round(remainingPct)}% restante` };
    if (remainingPct > 25) return { pct: remainingPct, barColor: 'bg-yellow-500', label: `SLA: ${Math.round(remainingPct)}% restante` };
    return { pct: remainingPct, barColor: 'bg-red-500', label: `SLA: ${Math.round(remainingPct)}% restante` };
  };

  const slaInfo = getSlaInfo();

  const getStatusIndicator = () => {
    if (task.status === 'done') {
      return (
        <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
        </svg>
      );
    }
    return null;
  };

  return (
    <div
      className={cn(
        "bg-background border rounded p-3 hover:border-primary/50 transition-colors",
        getBorderClass(),
        getPulseClass(),
        task.status === 'done' && "opacity-75"
      )}
      data-testid={`task-card-${task.id}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4
          className={cn(
            "font-medium text-sm leading-tight flex-1 mr-2",
            task.status === 'done' && "line-through"
          )}
          data-testid={`task-card-title-${task.id}`}
        >
          {task.title}
        </h4>
        <div className="flex items-center space-x-1 shrink-0">
          {getPriorityBadge()}
          {getStatusIndicator()}
        </div>
      </div>

      {task.description && (
        <p
          className="text-xs text-muted-foreground mb-2 line-clamp-2"
          data-testid={`task-card-description-${task.id}`}
        >
          {task.description}
        </p>
      )}

      {/* SLA indicator */}
      {slaInfo && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mb-2">
                <div className="flex items-center justify-between text-[10px] mb-0.5">
                  <span className="text-muted-foreground">SLA</span>
                  <span className={cn(
                    slaInfo.pct > 50 ? 'text-green-400' :
                    slaInfo.pct > 25 ? 'text-yellow-400' : 'text-red-400'
                  )}>{Math.round(slaInfo.pct)}%</span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", slaInfo.barColor)}
                    style={{ width: `${slaInfo.pct}%` }}
                  />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>{slaInfo.label}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Tags */}
      {(task.tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {(task.tags ?? []).map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center text-[10px] px-1.5 py-0 rounded-full font-medium"
              style={{ backgroundColor: tag.color + '33', color: tag.color, border: `1px solid ${tag.color}55` }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <Avatar className="w-5 h-5">
            <AvatarImage src={task.assignee?.profileImageUrl || undefined} />
            <AvatarFallback className="text-[10px] font-semibold bg-primary/20 text-primary">
              {getInitials(task.assignee?.firstName, task.assignee?.lastName, task.assignee?.email)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate max-w-[100px]" data-testid={`task-card-assignee-${task.id}`}>
            {getUserName(task.assignee?.firstName, task.assignee?.lastName, task.assignee?.email)}
          </span>
        </div>
        <span className="text-xs text-muted-foreground shrink-0" data-testid={`task-card-due-date-${task.id}`}>
          {formatDueDate(task.dueDate)}
        </span>
      </div>

      {task.subtasks.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtarefas</span>
            <span className="text-muted-foreground">{calculateProgress()}%</span>
          </div>
          <Progress
            value={calculateProgress()}
            className="h-1"
            data-testid={`task-card-progress-${task.id}`}
          />
        </div>
      )}
    </div>
  );
}
