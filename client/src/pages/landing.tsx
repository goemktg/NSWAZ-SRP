import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

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
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{
          backgroundImage: `url('https://web.ccpgamescdn.com/aws/eveonline/images/backgrounds/eve-background-1.jpg')`,
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center">
              <svg viewBox="0 0 100 100" className="h-10 w-10" fill="none">
                <polygon 
                  points="50,10 90,85 10,85" 
                  stroke="#4ade80" 
                  strokeWidth="3" 
                  fill="transparent"
                />
                <polygon 
                  points="50,25 75,70 25,70" 
                  stroke="#22c55e" 
                  strokeWidth="2" 
                  fill="transparent"
                />
              </svg>
            </div>
            <span className="text-xl font-light tracking-wide text-white/90" data-testid="text-logo">
              NISUWA CARTEL
            </span>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="w-full max-w-md space-y-8 text-center">
            <h1 className="text-2xl font-light tracking-wider text-white/80" data-testid="text-hero-title">
              Ship Replacement Program
            </h1>
            
            <div className="space-y-4">
              <Button 
                size="lg" 
                className="w-full max-w-xs bg-transparent border border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                asChild 
                data-testid="button-login"
              >
                <a href="/api/login" className="flex items-center justify-center gap-3">
                  <span className="text-sm font-bold tracking-widest text-green-400">EVE</span>
                  <span className="text-sm">LOG IN with EVE Online</span>
                </a>
              </Button>

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
