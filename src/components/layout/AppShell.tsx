import { useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Building2, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABELS } from "@/lib/format";
import { orgThemeStyle, parseOrgTheme } from "@/lib/org-theme";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type KnownRoute =
  | "/crm/dashboard"
  | "/crm/propiedades"
  | "/crm/prospectos"
  | "/crm/leads"
  | "/crm/actividades"
  | "/crm/documentos"
  | "/crm/duenos"
  | "/crm/equipo"
  | "/crm/admin/agencia"
  | "/admin";

export interface NavItem {
  to: KnownRoute;
  label: string;
  icon: LucideIcon;
}

function initials(name?: string | null) {
  if (!name) return "U";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppShell({
  title,
  items,
  children,
}: {
  title: string;
  items: NavItem[];
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, organization, role, signOut } = useAuth();
  const navigate = useNavigate();

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  // The super_admin panel always keeps the platform's own default branding,
  // regardless of which organization's data is being viewed.
  const isAdminPanel = pathname.startsWith("/admin");
  const theme = isAdminPanel ? null : parseOrgTheme(organization?.theme ?? null);

  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div
      className="flex min-h-screen w-full bg-background"
      style={orgThemeStyle(theme, "crm")}
    >
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center gap-2 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight">Brokers</p>
            <p className="text-xs text-sidebar-foreground/70">{title}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(item.to)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                {initials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium">{profile?.full_name || "Usuario"}</p>
              <p className="truncate text-xs text-sidebar-foreground/70">
                {role ? ROLE_LABELS[role] : ""}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              aria-label="Cerrar sesión"
              className="rounded-md p-2 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold">Brokers</span>
          </div>
          <span className="truncate text-xs text-muted-foreground">
            {organization?.name ?? title}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 md:px-8 md:pb-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-card/95 backdrop-blur md:hidden">
        {items.slice(0, 4).map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
              isActive(item.to) ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors"
            >
              <Menu className="h-5 w-5" />
              Menú
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader className="text-left">
              <SheetTitle>Menú</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-2 py-2">
              {items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border border-border px-2 py-3 text-center text-xs font-medium transition-colors ${
                    isActive(item.to)
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </div>
            <button
              onClick={handleSignOut}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </SheetContent>
        </Sheet>
      </nav>

    </div>
  );
}
