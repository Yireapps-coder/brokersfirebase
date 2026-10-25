import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Home,
  Users,
  KanbanSquare,
  CalendarClock,
  UsersRound,
  Building2,
  FolderArchive,
  Contact,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/crm")({
  component: CrmLayout,
});

function CrmLayout() {
  const { role } = useAuth();

  const items: NavItem[] = [
    { to: "/crm/dashboard", label: "Inicio", icon: LayoutDashboard },
    { to: "/crm/propiedades", label: "Propiedades", icon: Home },
    { to: "/crm/prospectos", label: "Prospectos", icon: Users },
    { to: "/crm/leads", label: "Embudo", icon: KanbanSquare },
    { to: "/crm/actividades", label: "Actividades", icon: CalendarClock },
    ...(role !== "agent"
      ? ([
          { to: "/crm/documentos", label: "Documentos", icon: FolderArchive },
          { to: "/crm/duenos", label: "Dueños", icon: Contact },
          { to: "/crm/equipo", label: "Equipo", icon: UsersRound },
          { to: "/crm/admin/agencia", label: "Agencia", icon: Building2 },
        ] as NavItem[])
      : []),
  ];

  return (
    <AppShell title="CRM" items={items}>
      <Outlet />
    </AppShell>
  );
}
