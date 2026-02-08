import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Home, Users, Banknote, Settings, LogOut, Store, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NavBar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location === path;

  if (!user) return null;

  return (
    <>
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b h-16 px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg leading-tight text-primary">
              {user.shopName}
            </h1>
            <p className="text-xs text-muted-foreground">
              Online • {user.ownerName}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => logout()}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t pb-safe">
        <div className="flex justify-around items-center h-16">
          <Link href="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-gray-600'}`}>
            <Home className={`h-6 w-6 ${isActive('/') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          <Link href="/customers" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/customers') ? 'text-primary' : 'text-muted-foreground hover:text-gray-600'}`}>
            <Users className={`h-6 w-6 ${isActive('/customers') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Khata</span>
          </Link>

          <Link href="/sales" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/sales') ? 'text-primary' : 'text-muted-foreground hover:text-gray-600'}`}>
            <Banknote className={`h-6 w-6 ${isActive('/sales') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Sales</span>
          </Link>

          <Link href="/ledger" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/ledger') ? 'text-primary' : 'text-muted-foreground hover:text-gray-600'}`}>
            <ReceiptText className={`h-6 w-6 ${isActive('/ledger') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Ledger</span>
          </Link>

          <Link href="/settings" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/settings') ? 'text-primary' : 'text-muted-foreground hover:text-gray-600'}`}>
            <Settings className={`h-6 w-6 ${isActive('/settings') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Settings</span>
          </Link>
        </div>
      </nav>

      {/* Spacer for fixed header */}
      <div className="h-16" />
    </>
  );
}
