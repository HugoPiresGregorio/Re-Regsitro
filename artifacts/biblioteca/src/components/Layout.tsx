import { useAuth } from "@/contexts/AuthContext";
import { useLogout } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { LogOut, BookOpen, User, Folder, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setLocation("/login");
        toast({ title: "Sessão encerrada", description: "Você saiu do sistema." });
      }
    });
  };

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Sidebar - hidden when printing */}
      <aside className="no-print w-full md:w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col shrink-0">
        <div className="p-6 border-b border-sidebar-border flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-sidebar-primary" />
          <h1 className="font-serif font-bold text-lg leading-tight tracking-tight">
            Re-Registro<br />
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
            <Home className="h-5 w-5" />
            <span className="font-medium">Início</span>
          </Link>
          
          {user.role === 'employee' && (
            <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
              <Folder className="h-5 w-5" />
              <span className="font-medium">Minha Pasta</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-sidebar-foreground/70 truncate capitalize">{user.role === 'coordinator' ? 'Coordenadora' : 'Funcionário(a)'}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
