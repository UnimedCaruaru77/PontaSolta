import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Kanban, 
  Users, 
  UsersRound, 
  ClipboardList,
  LogOut,
  Network
} from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";

interface SidebarNavProps {
  user?: User | null;
  currentPath: string;
}

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/kanban", icon: Kanban, label: "Kanban" },
  { path: "/tasks", icon: ClipboardList, label: "Minhas Tarefas" },
  { path: "/equipes", icon: Network, label: "Equipes" },
  { path: "/team", icon: UsersRound, label: "Equipe" },
  { path: "/users", icon: Users, label: "Usuários" },
];

export default function SidebarNav({ user, currentPath }: SidebarNavProps) {
  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/" || currentPath === "/dashboard";
    }
    return currentPath.startsWith(path);
  };

  const getInitials = (user?: User | null) => {
    if (!user) return "U";
    const firstName = user.firstName || user.email?.charAt(0) || "U";
    const lastName = user.lastName || "";
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  };

  return (
    <div className="w-64 sidebar-gradient border-r border-primary/30 p-6 flex flex-col" data-testid="sidebar">
      <div className="mb-8">
        <h1 className="text-2xl font-mono font-bold neon-text" data-testid="sidebar-title">
          PONTA SOLTA
        </h1>
        <p className="text-sm text-muted-foreground mt-1" data-testid="sidebar-version">
          v2.5.0
        </p>
      </div>
      
      <nav className="space-y-1 flex-1" data-testid="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link key={item.path} href={item.path}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start px-3 py-2 h-auto",
                  active
                    ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                data-testid={`nav-${item.path.substring(1) || "dashboard"}`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
      
      <div className="pt-6 border-t border-border">
        <div className="bg-card border border-border rounded p-3 mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="text-primary-foreground font-semibold text-sm" data-testid="user-initials">
                  {getInitials(user)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="user-name">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || "Usuário"
                }
              </p>
              <p className="text-xs text-muted-foreground truncate" data-testid="user-role">
                {user?.role === 'admin' ? 'Administrador' : 
                 user?.role === 'manager' ? 'Gestor' : 'Membro'}
              </p>
            </div>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
}
