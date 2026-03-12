import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { History, Plus, Edit, Trash2, User, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TaskAuditLog, User as UserType } from "@shared/schema";

interface TaskAuditLogProps {
  taskId: string;
}

type AuditLogWithUser = TaskAuditLog & { user: UserType };

export function TaskAuditLog({ taskId }: TaskAuditLogProps) {
  const { data: logs, isLoading } = useQuery<AuditLogWithUser[]>({
    queryKey: ["/api/tasks", taskId, "audit"],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/audit`);
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    },
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return <Plus className="size-4 text-secondary" />;
      case 'updated': return <Edit className="size-4 text-primary" />;
      case 'deleted': return <Trash2 className="size-4 text-red-400" />;
      default: return <Edit className="size-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (action: string, field?: string | null) => {
    if (action === 'created') return 'criou a tarefa';
    if (action === 'deleted') return 'excluiu a tarefa';
    if (action === 'updated' && field) {
      const fieldLabels: Record<string, string> = {
        status: 'status',
        priority: 'prioridade',
        urgency: 'urgência',
        importance: 'importância',
        complexity: 'complexidade',
        title: 'título',
        description: 'descrição',
        assigneeId: 'responsável',
        dueDate: 'prazo',
        startDate: 'data de início',
      };
      return `alterou ${fieldLabels[field] || field}`;
    }
    return 'atualizou a tarefa';
  };

  const formatValue = (value: string | null, field?: string | null) => {
    if (!value) return 'N/A';
    try {
      const parsed = JSON.parse(value);
      if (field === 'status') {
        const statusLabels: Record<string, string> = {
          todo: 'A Fazer',
          in_progress: 'Em Progresso',
          review: 'Em Revisão',
          done: 'Concluído',
        };
        return statusLabels[parsed] || parsed;
      }
      if (field === 'priority' || field === 'urgency' || field === 'importance' || field === 'complexity') {
        const labels: Record<string, string> = {
          low: 'Baixa',
          medium: 'Média',
          high: 'Alta',
          critical: 'Crítica',
          simple: 'Simples',
          complex: 'Complexa',
        };
        return labels[parsed] || parsed;
      }
      if (field === 'dueDate' || field === 'startDate') {
        return new Date(parsed).toLocaleDateString('pt-BR');
      }
      return typeof parsed === 'object' ? JSON.stringify(parsed) : String(parsed);
    } catch {
      return value;
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (firstName && lastName) {
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    }
    if (firstName) return firstName.charAt(0).toUpperCase();
    return "U";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <History className="size-5 text-primary" />
        <h3 className="text-lg font-semibold">
          Histórico de Alterações ({logs?.length || 0})
        </h3>
      </div>

      {!logs || logs.length === 0 ? (
        <Card className="p-6 bg-muted/15 border-border text-center">
          <History className="size-8 mx-auto mb-2 text-primary/50" />
          <p className="text-muted-foreground text-sm">
            Nenhuma alteração registrada ainda.
          </p>
        </Card>
      ) : (
        <div className="space-y-3 relative before:absolute before:left-5 before:top-0 before:bottom-0 before:w-0.5 before:bg-primary/20">
          {logs.map((log, index) => (
            <div
              key={log.id}
              data-testid={`audit-log-${log.id}`}
              className="relative pl-12 pb-4"
            >
              <div className="absolute left-3 top-1 size-4 rounded-full bg-card border-2 border-primary flex items-center justify-center">
                {getActionIcon(log.action)}
              </div>

              <Card className="p-4 bg-muted/20 border-border hover:border-primary/40 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="size-8 border-2 border-primary/30">
                      <AvatarImage src={log.user?.profileImageUrl ?? undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {getInitials(log.user?.firstName, log.user?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground text-sm">
                          {log.user?.firstName} {log.user?.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.createdAt || new Date()), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80">
                        {getActionLabel(log.action, log.field)}
                      </p>
                      {log.oldValue !== null && log.newValue !== null && (
                        <div className="mt-2 text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                              Anterior: {formatValue(log.oldValue, log.field)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                              Novo: {formatValue(log.newValue, log.field)}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
