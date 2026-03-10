import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { Plus, Trash2, Save } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TeamWithMembers, SkillDefinition, MemberEvaluationWithSkill } from "@shared/schema";

export default function PerformancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillType, setNewSkillType] = useState<"technical" | "behavioral">("technical");
  const [scores, setScores] = useState<Record<string, number>>({});

  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

  const { data: teams = [] } = useQuery<TeamWithMembers[]>({ queryKey: ["/api/teams"] });
  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  // Check if current user is lead of selected team
  const isLead = selectedTeam?.members.some(m => m.id === user?.id && (m as any).isLead);

  const canEvaluate = isAdminOrManager || isLead;

  const { data: skills = [] } = useQuery<SkillDefinition[]>({ queryKey: ["/api/skills"] });
  const technicalSkills = skills.filter(s => s.type === "technical");
  const behavioralSkills = skills.filter(s => s.type === "behavioral");

  const { data: evaluations = [] } = useQuery<MemberEvaluationWithSkill[]>({
    queryKey: ["/api/teams", selectedTeamId, "evaluations", selectedUserId],
    queryFn: async () => {
      if (!selectedTeamId || !selectedUserId) return [];
      const res = await fetch(`/api/teams/${selectedTeamId}/evaluations/${selectedUserId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!(selectedTeamId && selectedUserId),
  });

  // Sync evaluations into scores
  const syncedScores: Record<string, number> = {};
  evaluations.forEach(e => { syncedScores[e.skillId] = e.score; });
  const effectiveScores = { ...syncedScores, ...scores };

  const saveEvalMutation = useMutation({
    mutationFn: async (skillId: string) => {
      return apiRequest("POST", `/api/teams/${selectedTeamId}/evaluations`, {
        userId: selectedUserId,
        skillId,
        score: effectiveScores[skillId] ?? 3,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/teams", selectedTeamId, "evaluations", selectedUserId] });
    },
    onError: () => toast({ title: "Erro ao salvar avaliação", variant: "destructive" }),
  });

  const saveAllMutation = useMutation({
    mutationFn: async () => {
      const toSave = Object.entries(effectiveScores);
      for (const [skillId, score] of toSave) {
        await apiRequest("POST", `/api/teams/${selectedTeamId}/evaluations`, {
          userId: selectedUserId, skillId, score,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/teams", selectedTeamId, "evaluations", selectedUserId] });
      toast({ title: "Avaliações salvas com sucesso" });
    },
    onError: () => toast({ title: "Erro ao salvar avaliações", variant: "destructive" }),
  });

  const createSkillMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/skills", { name: newSkillName, type: newSkillType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/skills"] });
      setNewSkillName(""); setSkillDialogOpen(false);
      toast({ title: "Competência criada" });
    },
    onError: () => toast({ title: "Erro ao criar competência", variant: "destructive" }),
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/skills/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/skills"] });
      toast({ title: "Competência removida" });
    },
    onError: () => toast({ title: "Erro ao remover competência", variant: "destructive" }),
  });

  const buildRadarData = (skillList: SkillDefinition[]) =>
    skillList.map(s => ({ subject: s.name, score: effectiveScores[s.id] ?? 0 }));

  const radarTech = buildRadarData(technicalSkills);
  const radarBehavioral = buildRadarData(behavioralSkills);

  const selectedMember = selectedTeam?.members.find(m => m.id === selectedUserId);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedTeamId} onValueChange={v => { setSelectedTeamId(v); setSelectedUserId(""); setScores({}); }}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Selecione equipe..." />
          </SelectTrigger>
          <SelectContent>
            {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {selectedTeamId && (
          <Select value={selectedUserId} onValueChange={v => { setSelectedUserId(v); setScores({}); }}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Selecione membro..." />
            </SelectTrigger>
            <SelectContent>
              {selectedTeam?.members.map(m => (
                <SelectItem key={m.id} value={m.id}>
                  {m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : m.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {canEvaluate && (
          <Button variant="outline" size="sm" onClick={() => setSkillDialogOpen(true)} className="gap-2 ml-auto">
            <Plus className="w-4 h-4" />
            Gerenciar Competências
          </Button>
        )}
      </div>

      {!selectedTeamId && (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            Selecione uma equipe para ver as avaliações.
          </CardContent>
        </Card>
      )}

      {selectedTeamId && !selectedUserId && (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            Selecione um membro para visualizar o perfil de competências.
          </CardContent>
        </Card>
      )}

      {selectedUserId && (
        <>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center overflow-hidden">
              {selectedMember?.profileImageUrl ? (
                <img src={selectedMember.profileImageUrl} alt="" className="w-10 h-10 object-cover" />
              ) : (
                <span className="text-primary-foreground font-bold text-sm">
                  {((selectedMember?.firstName || "")[0] + (selectedMember?.lastName || "")[0]).toUpperCase() || "U"}
                </span>
              )}
            </div>
            <div>
              <p className="font-semibold">
                {selectedMember?.firstName && selectedMember?.lastName
                  ? `${selectedMember.firstName} ${selectedMember.lastName}`
                  : selectedMember?.email}
              </p>
              {(selectedMember as any)?.isLead && <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">Líder</Badge>}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar técnico */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-sm font-medium">Competências Técnicas</CardTitle></CardHeader>
              <CardContent>
                {radarTech.length === 0 ? (
                  <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">Nenhuma competência técnica cadastrada.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarTech}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                      <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Radar comportamental */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-sm font-medium">Competências Comportamentais</CardTitle></CardHeader>
              <CardContent>
                {radarBehavioral.length === 0 ? (
                  <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">Nenhuma competência comportamental cadastrada.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarBehavioral}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                      <Radar name="Score" dataKey="score" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Evaluation form */}
          {canEvaluate && skills.length > 0 && (
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Avaliar Competências (1 – 5)</CardTitle>
                  <Button size="sm" onClick={() => saveAllMutation.mutate()} disabled={saveAllMutation.isPending} className="gap-2">
                    <Save className="w-4 h-4" />
                    {saveAllMutation.isPending ? "Salvando..." : "Salvar tudo"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {skills.map(skill => (
                  <div key={skill.id} className="flex items-center gap-4">
                    <div className="w-40 shrink-0">
                      <p className="text-sm font-medium">{skill.name}</p>
                      <p className="text-xs text-muted-foreground">{skill.type === "technical" ? "Técnica" : "Comportamental"}</p>
                    </div>
                    <div className="flex-1">
                      <Slider
                        min={1} max={5} step={1}
                        value={[effectiveScores[skill.id] ?? 3]}
                        onValueChange={([v]) => setScores(prev => ({ ...prev, [skill.id]: v }))}
                      />
                    </div>
                    <span className="w-6 text-center font-bold text-primary">{effectiveScores[skill.id] ?? 3}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Skill management dialog */}
      <Dialog open={skillDialogOpen} onOpenChange={setSkillDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Competências</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nova competência</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome da competência..."
                  value={newSkillName}
                  onChange={e => setNewSkillName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && newSkillName.trim() && createSkillMutation.mutate()}
                />
                <Select value={newSkillType} onValueChange={v => setNewSkillType(v as any)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Técnica</SelectItem>
                    <SelectItem value="behavioral">Comportamental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => createSkillMutation.mutate()}
                disabled={!newSkillName.trim() || createSkillMutation.isPending}
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto">
              {skills.map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded border border-border/50 hover:bg-muted/30">
                  <div>
                    <span className="text-sm font-medium">{s.name}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {s.type === "technical" ? "Técnica" : "Comportamental"}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSkillMutation.mutate(s.id)}
                    className="text-destructive hover:text-destructive h-7 w-7"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {skills.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma competência cadastrada.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkillDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
