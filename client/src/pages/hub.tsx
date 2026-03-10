import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, CheckCircle2, Circle, Crown, Megaphone, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TeamWithMembers, OnboardingItemWithProgress, Notification } from "@shared/schema";

function MemberCard({ member, isCurrentUser }: { member: any; isCurrentUser: boolean }) {
  const initials = ((member.firstName || "")[0] + (member.lastName || "")[0]).toUpperCase() || member.email?.[0]?.toUpperCase() || "U";
  const fullName = member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : member.email;
  const roleLabel = member.role === "admin" ? "Admin" : member.role === "manager" ? "Gestor" : "Membro";

  return (
    <Card className={`border-border/50 ${isCurrentUser ? "border-primary/40 bg-primary/5" : ""}`}>
      <CardContent className="pt-5 text-center">
        <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center bg-primary overflow-hidden relative">
          {member.profileImageUrl ? (
            <img src={member.profileImageUrl} alt="" className="w-14 h-14 object-cover" />
          ) : (
            <span className="text-xl font-bold text-primary-foreground">{initials}</span>
          )}
          {member.isLead && (
            <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5">
              <Crown className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        <p className="font-semibold text-sm">{fullName}</p>
        <div className="flex items-center justify-center gap-1 mt-1">
          <Badge variant="outline" className="text-xs">{roleLabel}</Badge>
          {member.isLead && <Badge className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">Líder</Badge>}
          {isCurrentUser && <Badge variant="outline" className="text-xs border-primary/40 text-primary">Você</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

function AnnouncementSection({ teamId, canPost }: { teamId: string; canPost: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const { user } = useAuth();

  const { data: members = [] } = useQuery<any[]>({
    queryKey: ["/api/teams", teamId, "members"],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}/members`, { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: !!teamId,
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      for (const m of members) {
        await apiRequest("POST", "/api/notifications", {
          userId: m.id,
          title: msgTitle,
          message: msgBody,
          type: "announcement",
          teamId,
        });
      }
    },
    onSuccess: () => {
      toast({ title: "Aviso enviado para todos os membros" });
      setDialogOpen(false);
      setMsgTitle("");
      setMsgBody("");
    },
    onError: () => toast({ title: "Erro ao enviar aviso", variant: "destructive" }),
  });

  return (
    <div>
      {canPost && (
        <div className="mb-3 flex justify-end">
          <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-2">
            <Megaphone className="w-4 h-4" />
            Enviar Aviso
          </Button>
        </div>
      )}
      <p className="text-sm text-muted-foreground text-center py-6">
        Os avisos são enviados como notificações internas para todos os membros da equipe.
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enviar Aviso à Equipe</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input value={msgTitle} onChange={e => setMsgTitle(e.target.value)} placeholder="Título do aviso..." />
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} rows={4} placeholder="Escreva o aviso..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => postMutation.mutate()} disabled={!msgTitle.trim() || !msgBody.trim() || postMutation.isPending}>
              {postMutation.isPending ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OnboardingSection({ teamId, canManage }: { teamId: string; canManage: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemTitle, setItemTitle] = useState("");
  const [itemDesc, setItemDesc] = useState("");

  const { data: items = [] } = useQuery<OnboardingItemWithProgress[]>({
    queryKey: ["/api/teams", teamId, "onboarding"],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}/onboarding`, { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: !!teamId,
  });

  const toggleMutation = useMutation({
    mutationFn: (itemId: string) => apiRequest("POST", `/api/teams/${teamId}/onboarding/${itemId}/toggle`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/teams", teamId, "onboarding"] }),
    onError: () => toast({ title: "Erro ao atualizar progresso", variant: "destructive" }),
  });

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/teams/${teamId}/onboarding`, { title: itemTitle, description: itemDesc, order: items.length }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/teams", teamId, "onboarding"] });
      toast({ title: "Item adicionado" });
      setDialogOpen(false);
      setItemTitle("");
      setItemDesc("");
    },
    onError: () => toast({ title: "Erro ao adicionar item", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => apiRequest("DELETE", `/api/teams/${teamId}/onboarding/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/teams", teamId, "onboarding"] }),
    onError: () => toast({ title: "Erro ao remover item", variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Item
          </Button>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum item de onboarding configurado.
        </p>
      )}

      {items.map(item => {
        const doneByMe = item.completedBy.includes(user?.id || "");
        const totalMembers = item.completedBy.length;
        return (
          <div key={item.id} className="flex items-start gap-3 p-3 border border-border/50 rounded-lg hover:border-primary/30 transition-colors">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 shrink-0 ${doneByMe ? "text-green-400" : "text-muted-foreground"}`}
              onClick={() => toggleMutation.mutate(item.id)}
            >
              {doneByMe ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
            </Button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${doneByMe ? "line-through text-muted-foreground" : ""}`}>
                {item.title}
              </p>
              {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
              {canManage && (
                <p className="text-xs text-muted-foreground mt-1">
                  {totalMembers} membro{totalMembers !== 1 ? "s" : ""} concluíram
                </p>
              )}
            </div>
            {canManage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                onClick={() => deleteMutation.mutate(item.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        );
      })}

      {items.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-xs text-muted-foreground">Meu progresso</p>
          <Progress
            value={(items.filter(i => i.completedBy.includes(user?.id || "")).length / items.length) * 100}
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {items.filter(i => i.completedBy.includes(user?.id || "")).length} / {items.length} concluídos
          </p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Item de Onboarding</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título *</Label>
              <Input value={itemTitle} onChange={e => setItemTitle(e.target.value)} placeholder="Ex: Ler documento de processos..." />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={itemDesc} onChange={e => setItemDesc(e.target.value)} rows={3} placeholder="Detalhes adicionais..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!itemTitle.trim() || addMutation.isPending}>
              {addMutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function HubPage() {
  const { user } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const { data: teams = [] } = useQuery<TeamWithMembers[]>({ queryKey: ["/api/teams"] });
  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  const isLeadOrAdmin = user?.role === "admin" || user?.role === "manager" ||
    (selectedTeam?.members.some(m => m.id === user?.id && (m as any).isLead) ?? false);

  return (
    <div className="space-y-6">
      <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Selecione equipe..." />
        </SelectTrigger>
        <SelectContent>
          {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {!selectedTeamId ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            Selecione uma equipe para visualizar o Hub.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Members grid */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Membros da equipe</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {(selectedTeam?.members || []).map(m => (
                <MemberCard key={m.id} member={m} isCurrentUser={m.id === user?.id} />
              ))}
              {(selectedTeam?.members || []).length === 0 && (
                <p className="text-muted-foreground text-sm col-span-full text-center py-8">
                  Nenhum membro nesta equipe.
                </p>
              )}
            </div>
          </div>

          {/* Tabs for announcements and onboarding */}
          <Tabs defaultValue="onboarding">
            <TabsList>
              <TabsTrigger value="onboarding" className="gap-2">
                <ListChecks className="w-4 h-4" />
                Onboarding
              </TabsTrigger>
              <TabsTrigger value="announcements" className="gap-2">
                <Megaphone className="w-4 h-4" />
                Avisos
              </TabsTrigger>
            </TabsList>
            <TabsContent value="onboarding">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Checklist de Onboarding</CardTitle>
                </CardHeader>
                <CardContent>
                  <OnboardingSection teamId={selectedTeamId} canManage={isLeadOrAdmin} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="announcements">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Avisos da Equipe</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnnouncementSection teamId={selectedTeamId} canPost={isLeadOrAdmin} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
