import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from "recharts";
import { Download, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import type { TeamWithMembers } from "@shared/schema";

const STATUS_LABELS: Record<string, string> = {
  todo: "A Fazer",
  in_progress: "Em Progresso",
  review: "Revisão",
  done: "Concluído",
  renegotiated: "Repactuado",
};

const STATUS_COLORS: Record<string, string> = {
  todo: "#6366f1",
  in_progress: "#f59e0b",
  review: "#3b82f6",
  done: "#22c55e",
  renegotiated: "#a855f7",
};

const PRIORITY_COLORS = ["#ef4444", "#f59e0b", "#22c55e"];
const PRIORITY_LABELS = ["Alta", "Média", "Baixa"];

function exportCSV(stats: any, teamName: string) {
  if (!stats) return;
  const rows: string[][] = [["Categoria", "Valor"]];
  Object.entries(stats.byStatus).forEach(([k, v]) => rows.push([`Status: ${STATUS_LABELS[k] || k}`, String(v)]));
  Object.entries(stats.byPriority).forEach(([k, v]) => rows.push([`Prioridade: ${k}`, String(v)]));
  stats.byAssignee?.forEach((a: any) => rows.push([`Responsável: ${a.name}`, String(a.count)]));
  const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dashboard-${teamName.replace(/\s+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  const { data: teams = [] } = useQuery<TeamWithMembers[]>({ queryKey: ["/api/teams"] });

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery<any>({
    queryKey: ["/api/teams", selectedTeamId, "dashboard"],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${selectedTeamId}/dashboard`, { credentials: "include" });
      if (res.status === 403) throw new Error("forbidden");
      if (!res.ok) throw new Error("error");
      return res.json();
    },
    enabled: !!selectedTeamId,
    retry: false,
  });

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  const statusData = stats
    ? Object.entries(stats.byStatus).map(([key, value]) => ({
        name: STATUS_LABELS[key] || key,
        value: value as number,
        fill: STATUS_COLORS[key] || "#888",
      }))
    : [];

  const priorityData = [
    { name: PRIORITY_LABELS[0], value: stats?.byPriority?.high || 0 },
    { name: PRIORITY_LABELS[1], value: stats?.byPriority?.medium || 0 },
    { name: PRIORITY_LABELS[2], value: stats?.byPriority?.low || 0 },
  ];

  const trendData = stats?.completionTrend || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecione uma equipe..." />
            </SelectTrigger>
            <SelectContent>
              {teams.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {stats && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCSV(stats, selectedTeam?.name || "equipe")}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        )}
      </div>

      {!selectedTeamId && (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            Selecione uma equipe para visualizar o dashboard.
          </CardContent>
        </Card>
      )}

      {selectedTeamId && error && (error as any).message === "forbidden" && (
        <Card className="border-red-500/30">
          <CardContent className="py-12 text-center">
            <Lock className="w-10 h-10 mx-auto mb-3 text-red-400" />
            <p className="text-red-400 font-medium">Acesso restrito</p>
            <p className="text-muted-foreground text-sm mt-1">
              Apenas líderes, gestores e admins podem acessar o dashboard desta equipe.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedTeamId && isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-64" />
            </Card>
          ))}
        </div>
      )}

      {stats && !error && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.byStatus).map(([key, val]) => (
              <Card key={key} className="border-border/50">
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground">{STATUS_LABELS[key] || key}</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: STATUS_COLORS[key] }}>{val as number}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart por status */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-sm font-medium">Tarefas por Status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={statusData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie chart por prioridade */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-sm font-medium">Distribuição por Prioridade</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={priorityData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}>
                      {priorityData.map((_, i) => (
                        <Cell key={i} fill={PRIORITY_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Line chart — evolução de conclusões */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-sm font-medium">Conclusões — Últimos 30 dias</CardTitle></CardHeader>
              <CardContent>
                {trendData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                    Nenhuma tarefa concluída nos últimos 30 dias.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={false} name="Concluídas" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Bar horizontal — por responsável */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-sm font-medium">Tarefas por Responsável (top 8)</CardTitle></CardHeader>
              <CardContent>
                {(stats.byAssignee || []).length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                    Nenhuma tarefa com responsável definido.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.byAssignee} layout="vertical">
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Tarefas" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
