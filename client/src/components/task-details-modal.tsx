import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskComments } from "./task-comments";
import { TaskAuditLog } from "./task-audit-log";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, 
  User, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  CheckSquare, 
  MessageSquare,
  FileText,
  History 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TaskWithDetails } from "@shared/schema";

interface TaskDetailsModalProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailsModal({ taskId, open, onOpenChange }: TaskDetailsModalProps) {
  const { data: task, isLoading } = useQuery<TaskWithDetails>({
    queryKey: ["/api/tasks", taskId],
    enabled: !!taskId && open,
  });

  if (!task && !isLoading) return null;

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (firstName && lastName) {
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    }
    if (firstName) return firstName.charAt(0).toUpperCase();
    return "U";
  };

  const calculateProgress = () => {
    if (!task || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(st => st.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/50';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-2 border-primary/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-3">
            <FileText className="size-6" />
            {task?.title || "Carregando..."}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : task ? (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-black/40">
              <TabsTrigger value="details" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                Detalhes
              </TabsTrigger>
              <TabsTrigger value="comments" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <MessageSquare className="size-4 mr-2" />
                Comentários ({task.comments?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <History className="size-4 mr-2" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-6">
              {/* Status and Priority */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/40 p-4 rounded border border-primary/20">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <Badge className="bg-primary/20 text-primary border-primary/50">
                    {getStatusLabel(task.status)}
                  </Badge>
                </div>
                <div className="bg-black/40 p-4 rounded border border-primary/20">
                  <p className="text-xs text-gray-400 mb-1">Prioridade</p>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
                <div className="bg-black/40 p-4 rounded border border-primary/20">
                  <p className="text-xs text-gray-400 mb-1">Urgência</p>
                  <Badge className={task.urgency === 'critical' || task.urgency === 'high' ? 'text-red-400 bg-red-500/20 border-red-500/50' : 'text-gray-400 bg-gray-500/20 border-gray-500/50'}>
                    {task.urgency === 'critical' ? 'Crítica' : task.urgency === 'high' ? 'Alta' : task.urgency === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
                <div className="bg-black/40 p-4 rounded border border-primary/20">
                  <p className="text-xs text-gray-400 mb-1">Complexidade</p>
                  <Badge className={task.complexity === 'complex' ? 'text-secondary bg-secondary/20 border-secondary/50' : 'text-gray-400 bg-gray-500/20 border-gray-500/50'}>
                    {task.complexity === 'complex' ? 'Complexa' : task.complexity === 'medium' ? 'Média' : 'Simples'}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <div className="bg-black/40 p-4 rounded border border-primary/20">
                  <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                    <FileText className="size-4" />
                    Descrição
                  </h4>
                  <p className="text-gray-300 whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              {/* Assignee and Dates */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-black/40 p-4 rounded border border-primary/20">
                  <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <User className="size-4" />
                    Responsável
                  </h4>
                  {task.assignee ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 border-2 border-primary/50">
                        <AvatarImage src={task.assignee.profileImageUrl} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {getInitials(task.assignee.firstName, task.assignee.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{task.assignee.firstName} {task.assignee.lastName}</p>
                        <p className="text-xs text-gray-400">{task.assignee.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400">Não atribuído</p>
                  )}
                </div>

                <div className="bg-black/40 p-4 rounded border border-primary/20 space-y-3">
                  <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                    <Calendar className="size-4" />
                    Prazos
                  </h4>
                  <div className="space-y-2">
                    {task.startDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="size-4 text-gray-400" />
                        <span className="text-gray-400">Início:</span>
                        <span>{new Date(task.startDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="size-4 text-orange-400" />
                        <span className="text-gray-400">Prazo:</span>
                        <span className={new Date(task.dueDate) < new Date() ? 'text-red-400 font-semibold' : ''}>
                          {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subtasks */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="bg-black/40 p-4 rounded border border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                      <CheckSquare className="size-4" />
                      Subtarefas ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})
                    </h4>
                    <span className="text-xs text-gray-400">{calculateProgress()}% concluído</span>
                  </div>
                  <Progress value={calculateProgress()} className="mb-3 h-2" />
                  <div className="space-y-2">
                    {task.subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 p-2 rounded bg-black/20 border border-primary/10"
                      >
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          readOnly
                          className="size-4 rounded border-primary/50 bg-black/40"
                        />
                        <span className={subtask.completed ? 'line-through text-gray-500' : ''}>
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="bg-black/40 p-4 rounded border border-primary/20 text-xs text-gray-400 space-y-1">
                <p>Criado por: <span className="text-white">{task.creator.firstName} {task.creator.lastName}</span></p>
                <p>Criado em: <span className="text-white">{new Date(task.createdAt).toLocaleDateString('pt-BR')} às {new Date(task.createdAt).toLocaleTimeString('pt-BR')}</span></p>
                <p>Última atualização: {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true, locale: ptBR })}</p>
              </div>
            </TabsContent>

            <TabsContent value="comments" className="mt-6">
              <TaskComments taskId={task.id} />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <TaskAuditLog taskId={task.id} />
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
