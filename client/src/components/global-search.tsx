import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Hash, Clock, CheckCircle2 } from "lucide-react";
import { TaskDetailsModal } from "./task-details-modal";
import type { TaskWithDetails } from "@shared/schema";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabel: Record<string, string> = {
  todo: "A Fazer",
  in_progress: "Em Progresso",
  review: "Em Revisão",
  done: "Concluído",
};

const statusColor: Record<string, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/20 text-primary",
  review: "bg-yellow-500/20 text-yellow-400",
  done: "bg-secondary/20 text-secondary",
};

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: tasks = [] } = useQuery<TaskWithDetails[]>({
    queryKey: ["/api/tasks"],
    enabled: open,
  });

  const normalize = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filtered = query.trim().length < 2
    ? []
    : (tasks as TaskWithDetails[]).filter(t => {
        const q = normalize(query.trim());
        const title = normalize(t.title || "");
        const ticket = normalize(t.ticketNumber || "");
        const assignee = normalize(
          t.assignee
            ? `${t.assignee.firstName || ""} ${t.assignee.lastName || ""} ${t.assignee.email || ""}`
            : ""
        );
        return title.includes(q) || ticket.includes(q) || assignee.includes(q);
      });

  const handleSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const formatDueDate = (dueDate: Date | string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((dateDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: "Atrasado", color: "text-red-400" };
    if (diffDays === 0) return { text: "Hoje", color: "text-orange-400" };
    if (diffDays === 1) return { text: "Amanhã", color: "text-yellow-400" };
    return { text: date.toLocaleDateString('pt-BR'), color: "text-muted-foreground" };
  };

  return (
    <>
      <Dialog open={open && !selectedTaskId} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl bg-card border-2 border-primary/50 text-card-foreground p-0 gap-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-primary flex items-center gap-2">
              <Search className="size-5" />
              Busca Global
            </DialogTitle>
          </DialogHeader>

          <div className="p-4">
            <Input
              autoFocus
              placeholder="Buscar por título, número de chamado ou responsável..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="bg-muted border-primary/40 placeholder:text-muted-foreground h-11"
            />
          </div>

          <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
            {query.trim().length < 2 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                Digite pelo menos 2 caracteres para buscar
              </p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                Nenhum resultado encontrado para "{query}"
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
                </p>
                {filtered.map(task => {
                  const due = formatDueDate(task.dueDate);
                  return (
                    <button
                      key={task.id}
                      onClick={() => handleSelect(task.id)}
                      className="w-full text-left p-3 rounded-lg bg-muted border border-border hover:border-primary/60 hover:bg-accent transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                              {task.title}
                            </span>
                            {task.status === 'done' && (
                              <CheckCircle2 className="size-3.5 text-secondary shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            {task.ticketNumber && (
                              <span className="text-xs text-blue-400 flex items-center gap-1">
                                <Hash className="size-3" />
                                {task.ticketNumber}
                              </span>
                            )}
                            {task.assignee && (
                              <span className="text-xs text-muted-foreground">
                                {task.assignee.firstName} {task.assignee.lastName || task.assignee.email}
                              </span>
                            )}
                            {task.team && (
                              <span className="text-xs text-muted-foreground">
                                {task.team.name}
                              </span>
                            )}
                            {due && (
                              <span className={`text-xs flex items-center gap-1 ${due.color}`}>
                                <Clock className="size-3" />
                                {due.text}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge className={`text-[10px] shrink-0 ${statusColor[task.status] || statusColor.todo}`}>
                          {statusLabel[task.status] || task.status}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <TaskDetailsModal
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onOpenChange={open => {
          if (!open) {
            setSelectedTaskId(null);
          }
        }}
      />
    </>
  );
}
