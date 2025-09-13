import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ClipboardList, 
  AlertTriangle, 
  Zap, 
  CheckCircle2 
} from "lucide-react";

export default function DashboardStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-testid="stats-loading">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total de Tarefas",
      value: (stats as any)?.totalTasks || 0,
      icon: ClipboardList,
      iconBg: "bg-primary/20",
      iconColor: "text-primary",
      testId: "stat-total-tasks"
    },
    {
      title: "Críticas",
      value: (stats as any)?.criticalTasks || 0,
      icon: AlertTriangle,
      iconBg: "bg-red-500/20",
      iconColor: "text-red-400",
      valueColor: "text-red-400",
      pulseClass: (stats as any)?.criticalTasks ? "pulse-critical" : "",
      testId: "stat-critical-tasks"
    },
    {
      title: "Em Progresso",
      value: (stats as any)?.inProgressTasks || 0,
      icon: Zap,
      iconBg: "bg-primary/20",
      iconColor: "text-primary",
      valueColor: "text-primary",
      testId: "stat-progress-tasks"
    },
    {
      title: "Concluídas",
      value: (stats as any)?.completedTasks || 0,
      icon: CheckCircle2,
      iconBg: "bg-secondary/20",
      iconColor: "text-secondary",
      valueColor: "text-secondary",
      testId: "stat-completed-tasks"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-testid="dashboard-stats">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={stat.title}
            className={`bg-card border-border ${stat.pulseClass || ""}`}
            data-testid={stat.testId}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground" data-testid={`${stat.testId}-label`}>
                    {stat.title}
                  </p>
                  <p 
                    className={`text-2xl font-bold ${stat.valueColor || ""}`}
                    data-testid={`${stat.testId}-value`}
                  >
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.iconBg}`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
