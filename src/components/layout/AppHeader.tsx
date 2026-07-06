import { useState } from "react";
import { Bell, Search, Globe, LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { ProfileDialog } from "@/components/profile/ProfileDialog";

export function AppHeader() {
  const { user, isAdmin, isMahallaStaff, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const initials = (user?.user_metadata?.full_name || user?.email || "SA")
    .split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();
  const roleLabel = isAdmin ? "Super admin" : isMahallaStaff ? "Mahalla xodimi" : "Foydalanuvchi";
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger />
      <div className="hidden flex-1 max-w-md md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Fuqaro, mahalla yoki murojaat qidirish..."
            className="h-9 pl-9 bg-secondary/60 border-transparent focus-visible:bg-card"
          />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" className="hidden gap-2 md:inline-flex">
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium">UZ</span>
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse-glow" />
        </Button>
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="ml-1 flex items-center gap-3 rounded-lg border border-border bg-card px-2 py-1 transition-colors hover:bg-accent/40"
          title="Profil sozlamalari"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-[11px] gradient-primary text-white">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden flex-col leading-tight md:flex text-left">
            <span className="text-xs font-semibold truncate max-w-[140px]">
              {user?.user_metadata?.full_name || user?.email}
            </span>
            <span className="text-[10px] text-muted-foreground">{roleLabel}</span>
          </div>
        </button>
        <Button variant="ghost" size="icon" onClick={signOut} title="Chiqish">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  );
}
