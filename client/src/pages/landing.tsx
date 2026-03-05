import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: authConfig } = useQuery<{ googleEnabled: boolean }>({
    queryKey: ["/api/auth/config"],
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error === "google_failed") {
      toast({
        title: "Erro no login com Google",
        description: "Não foi possível autenticar com o Google. Tente novamente.",
        variant: "destructive",
      });
    } else if (error === "google_not_configured") {
      toast({
        title: "Google OAuth não configurado",
        description: "As credenciais do Google ainda não foram configuradas.",
        variant: "destructive",
      });
    }
  }, []);

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

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
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

            {authConfig?.googleEnabled && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-3 border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  onClick={handleGoogleLogin}
                  data-testid="button-google-login"
                >
                  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </svg>
                  Entrar com Google
                </Button>

                <div className="flex items-center gap-3 my-6">
                  <Separator className="flex-1 bg-border/50" />
                  <span className="text-xs text-muted-foreground font-mono">OU</span>
                  <Separator className="flex-1 bg-border/50" />
                </div>
              </>
            )}
            
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
