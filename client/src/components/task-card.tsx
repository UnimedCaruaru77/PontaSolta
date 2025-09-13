import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">CRÍTICO</Badge>;
    }
    if (task.urgency === 'high' || task.urgency === 'critical') {
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">URGENTE</Badge>;
    }
    if (task.importance === 'high') {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">ALTA</Badge>;
    }
    if (task.complexity === 'complex') {
      return <Badge className="bg-secondary/20 text-secondary border-secondary/50">COMPLEXA</Badge>;
    }
    return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">MÉDIA</Badge>;
  };

  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
    if (firstName && lastName) {
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    }
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
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Amanhã";
    if (diffDays < 0) return "Atrasado";
    if (diffDays <= 7) return `${diffDays} dias`;
    return date.toLocaleDateString();
  };

  const calculateProgress = () => {
    if (task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(st => st.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  };

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
        "bg-background border rounded p-4 hover:border-primary/50 transition-colors",
        getBorderClass(),
        getPulseClass(),
        task.status === 'done' && "opacity-75"
      )}
      data-testid={`task-card-${task.id}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 
          className={cn(
            "font-medium",
            task.status === 'done' && "line-through"
          )}
          data-testid={`task-card-title-${task.id}`}
        >
          {task.title}
        </h4>
        <div className="flex items-center space-x-1">
          {getPriorityBadge()}
          {getStatusIndicator()}
        </div>
      </div>
      
      <p 
        className="text-sm text-muted-foreground mb-3 line-clamp-2"
        data-testid={`task-card-description-${task.id}`}
      >
        {task.description || "Sem descrição"}
      </p>
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Avatar className="w-6 h-6 bg-primary">
            <AvatarFallback className="text-xs font-semibold text-background">
              {getInitials(task.assignee?.firstName, task.assignee?.lastName, task.assignee?.email)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground" data-testid={`task-card-assignee-${task.id}`}>
            {getUserName(task.assignee?.firstName, task.assignee?.lastName, task.assignee?.email)}
          </span>
        </div>
        <span className="text-xs text-muted-foreground" data-testid={`task-card-due-date-${task.id}`}>
          {formatDueDate(task.dueDate)}
        </span>
      </div>
      
      {task.subtasks.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtarefas</span>
            <span>{calculateProgress()}%</span>
          </div>
          <Progress 
            value={calculateProgress()} 
            className="h-1.5"
            data-testid={`task-card-progress-${task.id}`}
          />
        </div>
      )}

      {task.subtasks.length > 0 && (
        <div className="mt-2 flex items-center space-x-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            task.urgency === 'critical' ? "bg-red-500" :
            task.urgency === 'high' ? "bg-orange-500" :
            task.complexity === 'complex' ? "bg-secondary" : "bg-primary"
          )}></div>
          <span className="text-xs text-muted-foreground">
            {task.subtasks.length} subtarefas
          </span>
        </div>
      )}
    </div>
  );
}
