import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import backgroundImage from "@assets/Nag1_1766304787177.png";

export default function Landing() {
  const [, setLocation] = useLocation();
  
  const { data: devModeData } = useQuery<{ isDevelopment: boolean }>({
    queryKey: ["/api/dev-mode"],
  });

  const testLoginMutation = useMutation({
    mutationFn: async (role: string) => {
      const response = await apiRequest("POST", "/api/test-login", { role });
      return response.json();
    },
    onSuccess: () => {
      setLocation("/");
      window.location.reload();
    },
  });

  const isDevelopment = devModeData?.isDevelopment ?? false;

  return (
    <div className="relative min-h-screen bg-black">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="p-6">
          <div className="flex items-center gap-3">
            <img 
              src="https://images.evetech.net/alliances/99010412/logo?size=128" 
              alt="Nisuwa Cartel Logo"
              className="h-12 w-12"
            />
            <span className="text-xl font-light tracking-wide text-white/90" data-testid="text-logo">
              NISUWA CARTEL
            </span>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="w-full max-w-md space-y-8 text-center">
            <h1 className="text-2xl font-light tracking-wider text-white/80" data-testid="text-hero-title">
              SRP Management System
            </h1>
            
            <div className="space-y-4">
              <a 
                href="/api/login" 
                className="inline-block transition-opacity hover:opacity-80"
                data-testid="button-login"
              >
                <img 
                  src="https://web.ccpgamescdn.com/eveonlineassets/developers/eve-sso-login-black-large.png" 
                  alt="Log in with EVE Online"
                  className="h-auto"
                />
              </a>

              {isDevelopment && (
                <Button 
                  size="lg"
                  variant="ghost"
                  className="w-full max-w-xs text-white/60 hover:text-white hover:bg-white/10"
                  onClick={() => testLoginMutation.mutate("member")}
                  disabled={testLoginMutation.isPending}
                  data-testid="button-test-login"
                >
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Test Login (Dev Mode)
                </Button>
              )}
            </div>
          </div>
        </main>

        <footer className="p-6 text-center">
          <p className="text-xs text-white/40" data-testid="text-footer">
            Nisuwa Cartel Alliance - SRP Management System
          </p>
        </footer>
      </div>
    </div>
  );
}
