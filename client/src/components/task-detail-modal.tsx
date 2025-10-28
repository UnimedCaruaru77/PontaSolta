import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Clock, User, Calendar } from "lucide-react";
import type { TaskWithDetails } from "@shared/schema";

interface TaskDetailModalProps {
  taskId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function TaskDetailModal({ taskId, open, onClose }: TaskDetailModalProps) {
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const { data: task, isLoading } = useQuery({
    queryKey: ["/api/tasks", taskId],
    enabled: !!taskId && open,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      // Invalidate and refetch all task-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.refetchQueries({ queryKey: ["/api/tasks"] });
      queryClient.refetchQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Sucesso",
        description: "Tarefa atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar tarefa.",
        variant: "destructive",
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!taskId) return;
      await apiRequest("POST", `/api/tasks/${taskId}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId] });
      setComment("");
      toast({
        title: "Sucesso",
        description: "Comentário adicionado!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro", 
        description: "Falha ao adicionar comentário.",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Sucesso",
        description: "Tarefa excluída com sucesso!",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao excluir tarefa.",
        variant: "destructive",
      });
    },
  });

  if (!taskId) return null;

  const handleStatusChange = (newStatus: string) => {
    if (!taskId) return;
    updateTaskMutation.mutate({ 
      id: taskId, 
      data: { status: newStatus } 
    });
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    addCommentMutation.mutate(comment);
  };

  const handleDeleteTask = () => {
    if (!taskId) return;
    if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const getPriorityBadge = (task: TaskWithDetails) => {
    const badges = [];
    
    if (task.urgency === 'critical' && task.importance === 'high') {
      badges.push(<Badge key="critical" className="bg-red-500/20 text-red-400 border-red-500/50">CRÍTICO</Badge>);
    }
    if (task.urgency === 'high' || task.urgency === 'critical') {
      badges.push(<Badge key="urgent" className="bg-orange-500/20 text-orange-400 border-orange-500/50">URGENTE</Badge>);
    }
    if (task.importance === 'high') {
      badges.push(<Badge key="important" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">IMPORTANTE</Badge>);
    }
    if (task.complexity === 'complex') {
      badges.push(<Badge key="complex" className="bg-secondary/20 text-secondary border-secondary/50">COMPLEXA</Badge>);
    }

    return badges;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      todo: { label: "A Fazer", className: "bg-muted text-muted-foreground" },
      in_progress: { label: "Em Progresso", className: "bg-primary/20 text-primary" },
      review: { label: "Em Revisão", className: "bg-yellow-500/20 text-yellow-400" },
      done: { label: "Concluído", className: "bg-secondary/20 text-secondary" }
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.todo;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Não definido";
    return new Date(date).toLocaleDateString();
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString();
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
    return "Usuário";
  };

  const calculateProgress = (subtasks: any[]) => {
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter(st => st.completed).length;
    return Math.round((completed / subtasks.length) * 100);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="bg-card border border-primary/30 neon-glow w-full max-w-4xl max-h-[90vh] overflow-auto"
        data-testid="task-detail-modal"
      >
        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        ) : task ? (
          <>
            <DialogHeader className="border-b border-border pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <DialogTitle className="text-xl mb-2" data-testid="task-detail-title">
                    {task.title}
                  </DialogTitle>
                  <div className="flex items-center space-x-2 flex-wrap gap-2">
                    {getPriorityBadge(task)}
                    <span className="text-sm text-muted-foreground" data-testid="task-detail-id">
                      ID: #{task.id.slice(-8)}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Descrição</h4>
                    <p className="text-muted-foreground" data-testid="task-detail-description">
                      {task.description || "Nenhuma descrição fornecida"}
                    </p>
                  </div>
                  
                  {task.subtasks.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Subtarefas</h4>
                      <div className="space-y-2">
                        {task.subtasks.map((subtask) => (
                          <div 
                            key={subtask.id}
                            className="flex items-center space-x-3 p-2 bg-background rounded"
                            data-testid={`subtask-${subtask.id}`}
                          >
                            <Checkbox 
                              checked={subtask.completed}
                              disabled={updateTaskMutation.isPending}
                            />
                            <span className={`flex-1 ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {subtask.title}
                            </span>
                            {subtask.assignee && (
                              <span className="text-xs text-muted-foreground">
                                {getUserName(subtask.assignee.firstName, subtask.assignee.lastName, subtask.assignee.email)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium mb-3">Comentários</h4>
                    <div className="space-y-4">
                      {task.comments.map((comment) => (
                        <div 
                          key={comment.id}
                          className="flex space-x-3"
                          data-testid={`comment-${comment.id}`}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs font-semibold">
                              {getInitials(comment.user?.firstName, comment.user?.lastName, comment.user?.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-background border border-border rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">
                                  {getUserName(comment.user?.firstName, comment.user?.lastName, comment.user?.email)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTime(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="space-y-2">
                        <Textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Adicionar comentário..."
                          className="bg-input border-border"
                          rows={3}
                          data-testid="textarea-comment"
                        />
                        <Button 
                          onClick={handleAddComment}
                          disabled={addCommentMutation.isPending || !comment.trim()}
                          size="sm"
                          data-testid="button-add-comment"
                        >
                          {addCommentMutation.isPending ? "Enviando..." : "Comentar"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Sidebar */}
                <div className="space-y-6">
                  <div className="bg-background border border-border rounded p-4">
                    <h4 className="font-medium mb-3">Informações</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <div data-testid="task-detail-status">
                          {getStatusBadge(task.status)}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Responsável:</span>
                        <span data-testid="task-detail-assignee">
                          {task.assignee 
                            ? getUserName(task.assignee.firstName, task.assignee.lastName, task.assignee.email)
                            : "Não atribuído"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Criador:</span>
                        <span data-testid="task-detail-creator">
                          {getUserName(task.creator?.firstName, task.creator?.lastName, task.creator?.email)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Criado:</span>
                        <span data-testid="task-detail-created">
                          {formatDate(task.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prazo:</span>
                        <span 
                          className={task.dueDate && new Date(task.dueDate) < new Date() ? "text-red-400" : ""}
                          data-testid="task-detail-deadline"
                        >
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {task.subtasks.length > 0 && (
                    <div className="bg-background border border-border rounded p-4">
                      <h4 className="font-medium mb-3">Progresso</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{task.subtasks.filter(st => st.completed).length} de {task.subtasks.length} subtarefas</span>
                          <span data-testid="task-detail-progress-percentage">
                            {calculateProgress(task.subtasks)}%
                          </span>
                        </div>
                        <Progress 
                          value={calculateProgress(task.subtasks)} 
                          className="h-2"
                          data-testid="task-detail-progress"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {task.status !== 'done' && (
                      <>
                        {task.status === 'todo' && (
                          <Button 
                            onClick={() => handleStatusChange('in_progress')}
                            className="w-full bg-primary/20 text-primary hover:bg-primary/30"
                            disabled={updateTaskMutation.isPending}
                            data-testid="button-start-task"
                          >
                            Iniciar Tarefa
                          </Button>
                        )}
                        <Button 
                          onClick={() => handleStatusChange('done')}
                          className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                          disabled={updateTaskMutation.isPending}
                          data-testid="button-move-task"
                        >
                          Marcar como Concluído
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="outline"
                      className="w-full"
                      data-testid="button-edit-task"
                    >
                      Editar Tarefa
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
                      onClick={handleDeleteTask}
                      disabled={deleteTaskMutation.isPending}
                      data-testid="button-delete-task"
                    >
                      {deleteTaskMutation.isPending ? "Excluindo..." : "Excluir Tarefa"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6">
            <p className="text-center text-muted-foreground">Tarefa não encontrada</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
