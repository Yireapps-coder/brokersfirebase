import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Building2 } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Organization } from "@/integrations/firebase/types";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

const items: NavItem[] = [{ to: "/admin", label: "Organizaciones", icon: LayoutDashboard }];

function AdminPage() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role && role !== "super_admin") {
      navigate({ to: "/crm/dashboard", replace: true });
    }
  }, [loading, role, navigate]);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-orgs"],
    enabled: role === "super_admin",
    queryFn: async () => {
      const snap = await getDocs(collection(db, "organizations"));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Organization);
    },
  });

  return (
    <AppShell title="Admin" items={items}>
      <PageHeader
        title="Organizaciones"
        subtitle="Administra todas las agencias de la plataforma."
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((org) => (
            <Card key={org.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{org.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Slug: {org.slug}</p>
                  </div>
                  <Badge variant={org.status === "active" ? "default" : "secondary"}>
                    {org.status}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{org.address || "Sin dirección registrada"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
