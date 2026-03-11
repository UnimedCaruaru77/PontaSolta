import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { TaskDetailsModal } from "@/components/task-details-modal";
import { cn } from "@/lib/utils";
import { Filter, ChevronDown } from "lucide-react";
import type { TaskWithDetails } from "@shared/schema";

const ALL_STATUSES = [
  { value: "todo",         label: "A Fazer",      color: "bg-blue-500/20 text-blue-400 border-blue-500/50" },
  { value: "in_progress",  label: "Em Progresso",  color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" },
  { value: "review",       label: "Em Revisão",    color: "bg-purple-500/20 text-purple-400 border-purple-500/50" },
  { value: "renegotiated", label: "Repactuada",    color: "bg-orange-500/20 text-orange-400 border-orange-500/50" },
  { value: "done",         label: "Concluída",     color: "bg-green-500/20 text-green-400 border-green-500/50" },
];

const DEFAULT_STATUSES = ALL_STATUSES
  .filter(s => s.value !== "done")
  .map(s => s.value);

export default function Tasks() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeStatuses, setActiveStatuses] = useState<string[]>(DEFAULT_STATUSES);
  const [viewMode, setViewMode] = useState<"assigned" | "created" | "all">("assigned");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const { data: allTasks, isLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ["/api/tasks"],
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleStatus = (status: string) => {
    setActiveStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const filteredTasks = allTasks?.filter((task: TaskWithDetails) => {
    if (viewMode === "assigned" && task.assigneeId !== user?.id) return false;
    if (viewMode === "created" && task.creatorId !== user?.id) return false;
    if (!activeStatuses.includes(task.status || "todo")) return false;
    return true;
  }) || [];

  const getTaskPulseClass = (task: TaskWithDetails) => {
    if (task.status === 'done') return '';
    if (task.urgency === 'critical' && task.importance === 'high') return 'pulse-critical';
    if (task.urgency === 'high' || task.urgency === 'critical') return 'pulse-urgent';
    if (task.complexity === 'complex') return 'pulse-complex';
    return '';
  };

  const getPriorityBadges = (task: TaskWithDetails) => {
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

  const getCreatorName = (task: TaskWithDetails) => {
    const creator = task.creator;
    if (creator?.firstName && creator?.lastName) return `${creator.firstName} ${creator.lastName}`;
    return creator?.email || "Usuário";
  };

  const getAssigneeName = (task: TaskWithDetails) => {
    const assignee = task.assignee;
    if (!assignee) return "Não atribuído";
    if (assignee?.firstName && assignee?.lastName) return `${assignee.firstName} ${assignee.lastName}`;
    return assignee?.email || "Usuário";
  };

  const filterLabel = () => {
    if (activeStatuses.length === 0) return "Nenhum status";
    if (activeStatuses.length === ALL_STATUSES.length) return "Todos os status";
    const labels = ALL_STATUSES.filter(s => activeStatuses.includes(s.value)).map(s => s.label);
    return labels.length <= 2 ? labels.join(", ") : `${labels.length} status`;
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
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle>Minhas Tarefas</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Gerencie suas tarefas e acompanhe o progresso
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                  <SelectTrigger className="w-44" data-testid="select-view-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assigned">Atribuídas a mim</SelectItem>
                    <SelectItem value="created">Criadas por mim</SelectItem>
                    <SelectItem value="all">Todas</SelectItem>
                  </SelectContent>
                </Select>

                {/* Multi-status filter dropdown */}
                <div className="relative" ref={filterRef}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 h-9 px-3 border-border text-foreground"
                    onClick={() => setFilterOpen(o => !o)}
                    data-testid="button-status-filter"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span className="text-sm max-w-[140px] truncate">{filterLabel()}</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", filterOpen && "rotate-180")} />
                  </Button>

                  {filterOpen && (
                    <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-lg border border-border bg-card shadow-xl p-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-2">
                        Filtrar por status
                      </p>
                      {ALL_STATUSES.map(s => (
                        <button
                          key={s.value}
                          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/60 transition-colors text-left"
                          onClick={() => toggleStatus(s.value)}
                        >
                          <Checkbox
                            checked={activeStatuses.includes(s.value)}
                            className="rounded border-border pointer-events-none"
                          />
                          <Badge className={cn("text-[10px] px-1.5 py-0 pointer-events-none", s.color)}>
                            {s.label}
                          </Badge>
                        </button>
                      ))}
                      <div className="border-t border-border mt-2 pt-2 flex gap-1">
                        <button
                          className="flex-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted/60 transition-colors"
                          onClick={() => setActiveStatuses(ALL_STATUSES.map(s => s.value))}
                        >
                          Todos
                        </button>
                        <button
                          className="flex-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted/60 transition-colors"
                          onClick={() => setActiveStatuses(DEFAULT_STATUSES)}
                        >
                          Em aberto
                        </button>
                        <button
                          className="flex-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted/60 transition-colors"
                          onClick={() => setActiveStatuses([])}
                        >
                          Nenhum
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12" data-testid="no-tasks">
                  <p className="text-muted-foreground text-lg">Nenhuma tarefa encontrada</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {activeStatuses.length === 0
                      ? "Nenhum status selecionado no filtro"
                      : viewMode === "assigned" ? "Você não tem tarefas atribuídas com esses status"
                      : viewMode === "created" ? "Você não criou tarefas com esses status"
                      : "Não há tarefas disponíveis"}
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
