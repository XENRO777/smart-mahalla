import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Building2, Users, MessageSquare, Coins, Sparkles, Plug, BarChart3, Shield, Settings } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

type NavItem = { title: string; url: string; icon: any; badge?: string; adminOnly?: boolean };

const mainItems: NavItem[] = [
  { title: "Bosh sahifa", url: "/", icon: LayoutDashboard },
  { title: "Mahallalar", url: "/mahallalar", icon: Building2, adminOnly: true },
  { title: "Aholi ro'yxati", url: "/aholi", icon: Users },
  { title: "Murojaatlar", url: "/murojaatlar", icon: MessageSquare, badge: "12" },
  { title: "Xodimlar", url: "/xodimlar", icon: Shield, adminOnly: true },
];

const intelItems: NavItem[] = [
  { title: "AI Yordamchi", url: "/ai", icon: Sparkles, badge: "AI" },
  { title: "Tokenlar", url: "/tokenlar", icon: Coins },
  { title: "KPI Reyting", url: "/kpi", icon: BarChart3 },
  { title: "Integratsiya", url: "/integratsiya", icon: Plug, adminOnly: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { isAdmin } = useAuth();
  const isActive = (path: string) => path === "/" ? pathname === "/" : pathname.startsWith(path);
  const filterByRole = (items: NavItem[]) => items.filter((i) => !i.adminOnly || isAdmin);
  const visibleMain = filterByRole(mainItems);
  const visibleIntel = filterByRole(intelItems);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight">SmartMahalla</span>
              <span className="text-[11px] text-muted-foreground">Boshqaruv paneli</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupLabel>Asosiy</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMain.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && !collapsed && (
                        <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Intellekt va Tahlil</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleIntel.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && !collapsed && (
                        <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Sozlamalar">
                  <NavLink to="/sozlamalar">
                    <Settings className="h-4 w-4" />
                    <span>Sozlamalar</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
