import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error === "google_failed") {
      toast({
        title: "Erro no login com Google",
        description: "Não foi possível autenticar com o Google. Tente novamente.",
        variant: "destructive",
      });
    }
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-card border border-primary/30 neon-glow" data-testid="login-card">
          <CardContent className="p-10">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-mono font-bold neon-text mb-2" data-testid="app-title">
                PONTA SOLTA
              </h1>
              <p className="text-muted-foreground text-sm" data-testid="app-subtitle">
                Sistema de Gerenciamento de Tarefas e Equipes
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground mb-6">
                Acesse o sistema com sua conta Google corporativa
              </p>

              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-3 h-12 border-border hover:border-primary/60 hover:bg-primary/5 transition-all duration-200 text-sm font-medium"
                onClick={handleGoogleLogin}
                data-testid="button-google-login"
              >
                <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Entrar com Google
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground/60 mt-8">
              Apenas contas autorizadas têm acesso ao sistema
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
