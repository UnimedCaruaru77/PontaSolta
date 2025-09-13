import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
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
            
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@empresa.com"
                    className="bg-input border-border focus:border-primary focus:ring-primary"
                    data-testid="input-email"
                    disabled
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
                    disabled
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleLogin}
                className="w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 neon-glow"
                data-testid="button-login"
              >
                ACESSAR SISTEMA
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <p>Use o sistema de autenticação para fazer login</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
