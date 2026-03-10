import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format, isSameDay, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { Plus, Pencil, Trash2, CalendarDays, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TeamEvent, TeamWithMembers } from "@shared/schema";

import "react-day-picker/dist/style.css";

function EventDialog({
  open, onOpenChange, event, teamId, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event?: TeamEvent | null;
  teamId: string;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [location, setLocation] = useState(event?.location || "");
  const [startAt, setStartAt] = useState(
    event?.startAt ? format(new Date(event.startAt), "yyyy-MM-dd'T'HH:mm") : ""
  );
  const [endAt, setEndAt] = useState(
    event?.endAt ? format(new Date(event.endAt), "yyyy-MM-dd'T'HH:mm") : ""
  );

  const mutation = useMutation({
    mutationFn: () => {
      const body = { title, description, location, startAt: new Date(startAt), endAt: endAt ? new Date(endAt) : null };
      if (event) return apiRequest(`/api/events/${event.id}`, "PATCH", body);
      return apiRequest(`/api/teams/${teamId}/events`, "POST", body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/teams", teamId, "events"] });
      toast({ title: event ? "Evento atualizado" : "Evento criado" });
      onSaved();
      onOpenChange(false);
    },
    onError: (err: any) => {
      const msg = err?.message || "";
      if (msg.includes("403")) toast({ title: "Sem permissão", variant: "destructive" });
      else toast({ title: "Erro ao salvar evento", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{event ? "Editar Evento" : "Novo Evento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do evento..." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Início *</Label>
              <Input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} />
            </div>
            <div>
              <Label>Fim</Label>
              <Input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Local</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Local ou link..." />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Detalhes do evento..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!title.trim() || !startAt || mutation.isPending}
          >
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TeamEvent | null>(null);

  const { data: teams = [] } = useQuery<TeamWithMembers[]>({ queryKey: ["/api/teams"] });
  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  const { data: events = [] } = useQuery<TeamEvent[]>({
    queryKey: ["/api/teams", selectedTeamId, "events"],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${selectedTeamId}/events`, { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: !!selectedTeamId,
  });

  const isLeadOrAdmin = user?.role === "admin" || user?.role === "manager" ||
    (selectedTeam?.members.some(m => m.id === user?.id && (m as any).isLead) ?? false);

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/events/${id}`, "DELETE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/teams", selectedTeamId, "events"] });
      toast({ title: "Evento removido" });
    },
    onError: () => toast({ title: "Erro ao remover evento", variant: "destructive" }),
  });

  // Events on selected month
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const monthEvents = events.filter(e => {
    const d = new Date(e.startAt);
    return d >= monthStart && d <= monthEnd;
  });

  // Events on selected day
  const dayEvents = selectedDay
    ? events.filter(e => isSameDay(new Date(e.startAt), selectedDay))
    : monthEvents;

  // Dates with events (for highlighting)
  const eventDates = events.map(e => new Date(e.startAt));

  return (
    <div className="space-y-4">
      {/* Team selector + actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Selecione equipe..." />
          </SelectTrigger>
          <SelectContent>
            {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {isLeadOrAdmin && selectedTeamId && (
          <Button
            size="sm"
            onClick={() => { setEditingEvent(null); setDialogOpen(true); }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Evento
          </Button>
        )}
      </div>

      {!selectedTeamId ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            Selecione uma equipe para ver o calendário.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="border-border/50 lg:col-span-1">
            <CardContent className="p-4">
              <DayPicker
                mode="single"
                selected={selectedDay}
                onSelect={setSelectedDay}
                month={selectedMonth}
                onMonthChange={setSelectedMonth}
                locale={ptBR}
                modifiers={{ hasEvent: eventDates }}
                modifiersClassNames={{ hasEvent: "rdp-day_has_event" }}
                className="p-0"
              />
              <style>{`
                .rdp-day_has_event:not(.rdp-day_selected)::after {
                  content: '';
                  display: block;
                  width: 4px;
                  height: 4px;
                  border-radius: 50%;
                  background: hsl(var(--primary));
                  margin: 0 auto;
                }
              `}</style>
            </CardContent>
          </Card>

          {/* Event list */}
          <Card className="border-border/50 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {selectedDay
                  ? `Eventos em ${format(selectedDay, "d 'de' MMMM", { locale: ptBR })}`
                  : `Eventos de ${format(selectedMonth, "MMMM yyyy", { locale: ptBR })}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dayEvents.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-8">
                  {selectedDay ? "Nenhum evento neste dia." : "Nenhum evento este mês."}
                </p>
              )}
              {dayEvents.map(ev => (
                <div key={ev.id} className="border border-border/50 rounded-lg p-3 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{ev.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(ev.startAt), "dd/MM HH:mm")}
                          {ev.endAt && ` – ${format(new Date(ev.endAt), "HH:mm")}`}
                        </span>
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {ev.location}
                          </span>
                        )}
                      </div>
                      {ev.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ev.description}</p>}
                    </div>
                    {isLeadOrAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => { setEditingEvent(ev); setDialogOpen(true); }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => deleteEventMutation.mutate(ev.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        teamId={selectedTeamId}
        onSaved={() => setEditingEvent(null)}
      />
    </div>
  );
}
