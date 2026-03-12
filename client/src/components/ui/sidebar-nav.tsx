import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Kanban,
  Users,
  UsersRound,
  ClipboardList,
  LogOut,
  Network,
  Search,
  BarChart2,
  CalendarDays,
  Users2,
  TrendingUp,
  Bell,
  Check,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/global-search";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ScrollArea } from "./scroll-area";
import { apiRequest } from "@/lib/queryClient";
import type { User, Notification } from "@shared/schema";

interface SidebarNavProps {
  user?: User | null;
  currentPath: string;
}

const baseNavItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard", roles: ["all"] },
  { path: "/analytics", icon: BarChart2, label: "Analytics", roles: ["all"] },
  { path: "/kanban", icon: Kanban, label: "Kanban", roles: ["all"] },
  { path: "/tasks", icon: ClipboardList, label: "Minhas Tarefas", roles: ["all"] },
  { path: "/equipes", icon: Network, label: "Equipes", roles: ["all"] },
  { path: "/calendar", icon: CalendarDays, label: "Calendário", roles: ["all"] },
  { path: "/hub", icon: Users2, label: "Hub da Equipe", roles: ["all"] },
  { path: "/performance", icon: TrendingUp, label: "Desempenho", roles: ["admin", "manager", "lead"] },
  { path: "/team", icon: UsersRound, label: "Minha Equipe", roles: ["all"] },
  { path: "/users", icon: Users, label: "Usuários", roles: ["admin", "manager"] },
];

function NotificationBell({ user }: { user?: User | null }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
    enabled: !!user,
  });

  const unread = notifications.filter(n => !n.read).length;

  const markAllMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/notifications/read-all", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const typeIcon: Record<string, string> = {
    task: "🔔",
    announcement: "📢",
    warning: "⚠️",
    info: "ℹ️",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          title="Notificações"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" side="right" align="start">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-sm font-semibold">Notificações</span>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1 text-muted-foreground"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              <Check className="w-3 h-3" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma notificação.</p>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={cn(
                    "px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors",
                    !n.read && "bg-primary/5"
                  )}
                  onClick={() => !n.read && markOneMutation.mutate(n.id)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{typeIcon[n.type] || "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-medium truncate", !n.read && "text-foreground")}>{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.createdAt!), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default function SidebarNav({ user, currentPath }: SidebarNavProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  // Build list of teams where user is lead
  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ["/api/teams"],
    enabled: !!user,
  });
  const isLead = teams.some((t: any) => t.members?.some((m: any) => m.id === user?.id && m.isLead));

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/" || currentPath === "/dashboard";
    return currentPath.startsWith(path);
  };

  const getInitials = (u?: User | null) => {
    if (!u) return "U";
    const first = u.firstName || u.email?.charAt(0) || "U";
    const last = u.lastName || "";
    return (first.charAt(0) + last.charAt(0)).toUpperCase();
  };

  const visibleNavItems = baseNavItems.filter(item => {
    if (item.roles.includes("all")) return true;
    if (!user) return false;
    if (item.roles.includes(user.role || "")) return true;
    if (item.roles.includes("lead") && isLead) return true;
    return false;
  });

  return (
    <>
      <div className="w-64 sidebar-gradient border-r border-[var(--sidebar-border)] p-6 flex flex-col text-[var(--sidebar-foreground)]" data-testid="sidebar">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-mono font-bold neon-text" data-testid="sidebar-title">
              PONTA SOLTA
            </h1>
            <NotificationBell user={user} />
          </div>
          <p className="text-sm mt-1 text-[var(--sidebar-foreground)]/50" data-testid="sidebar-version">
            v3.5.0
          </p>
        </div>

        {/* Search button */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 mb-4 bg-transparent border border-[var(--sidebar-border)] text-[var(--sidebar-foreground)]/70 hover:border-[var(--sidebar-primary)]/60 hover:text-[var(--sidebar-primary)] hover:bg-[var(--sidebar-accent)]"
          onClick={() => setSearchOpen(true)}
          data-testid="button-global-search"
        >
          <Search className="w-4 h-4" />
          Buscar tarefa...
          <kbd className="ml-auto text-[10px] bg-[var(--sidebar-accent)] px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </Button>

        <nav className="space-y-0.5 flex-1 overflow-y-auto" data-testid="sidebar-nav">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-3 py-2 h-auto",
                    active
                      ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] border border-[var(--sidebar-primary)]/40 hover:bg-[var(--sidebar-accent)]/80"
                      : "text-[var(--sidebar-foreground)]/75 hover:text-[var(--sidebar-primary)] hover:bg-[var(--sidebar-accent)]"
                  )}
                  data-testid={`nav-${item.path.substring(1) || "dashboard"}`}
                >
                  <Icon className="w-4 h-4 mr-3 shrink-0" />
                  <span className="text-sm">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-[var(--sidebar-border)] mt-2">
          <div className="bg-[var(--sidebar-accent)] border border-[var(--sidebar-border)] rounded p-3 mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[var(--sidebar-primary)] rounded-full flex items-center justify-center overflow-hidden shrink-0">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <span className="text-[var(--sidebar-primary-foreground)] font-semibold text-sm" data-testid="user-initials">
                    {getInitials(user)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-[var(--sidebar-foreground)]" data-testid="user-name">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || "Usuário"}
                </p>
                <p className="text-xs text-[var(--sidebar-foreground)]/60 truncate" data-testid="user-role">
                  {user?.role === 'admin' ? 'Administrador' :
                   user?.role === 'manager' ? 'Gestor' : 'Membro'}
                  {isLead && " · Líder"}
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-[var(--sidebar-foreground)]/80 border border-[var(--sidebar-border)] bg-transparent hover:text-[var(--sidebar-primary)] hover:bg-[var(--sidebar-accent)] hover:border-[var(--sidebar-primary)]/50"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
