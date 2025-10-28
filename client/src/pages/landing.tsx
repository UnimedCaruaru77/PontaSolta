import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha email e senha",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao fazer login");
      }

      toast({
        title: "Sucesso",
        description: "Login realizado com sucesso!",
      });

      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Email ou senha incorretos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-card border border-primary/30 neon-glow" data-testid="login-card">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-mono font-bold neon-text mb-2" data-testid="app-title">
                PONTA SOLTA
              </h1>
              <p className="text-muted-foreground" data-testid="app-subtitle">
                Sistema de Tarefas Futurista
              </p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@empresa.com"
                    className="bg-input border-border focus:border-primary focus:ring-primary"
                    data-testid="input-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-input border-border focus:border-primary focus:ring-primary"
                    data-testid="input-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit"
                className="w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 neon-glow"
                data-testid="button-login"
                disabled={isLoading}
              >
                {isLoading ? "ENTRANDO..." : "ACESSAR SISTEMA"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
