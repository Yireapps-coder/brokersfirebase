import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Users,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/crm/dashboard")({
  component: DashboardPage,
});

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  description: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-16" />
        ) : (
          <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const { profile, organization } = useAuth();
  const orgId = profile?.organization_id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["crm-stats", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      try {
        const [propsSnap, availSnap, contactsSnap, actsSnap] = await Promise.all([
          getCountFromServer(query(collection(db, "properties"), where("organization_id", "==", orgId!))),
          getCountFromServer(query(collection(db, "properties"), where("organization_id", "==", orgId!), where("status", "==", "disponible"))),
          getCountFromServer(query(collection(db, "contacts"), where("organization_id", "==", orgId!))),
          getCountFromServer(query(collection(db, "activities"), where("organization_id", "==", orgId!))),
        ]);
        return {
          properties: propsSnap.data().count,
          available: availSnap.data().count,
          contacts: contactsSnap.data().count,
          activities: actsSnap.data().count,
        };
      } catch {
        return {
          properties: 0,
          available: 0,
          contacts: 0,
          activities: 0,
        };
      }
    },
  });

  return (
    <div>
      <PageHeader
        title={`Hola, ${profile?.full_name?.split(" ")[0] || "Bienvenido"}`}
        subtitle={`Panel de control de ${organization?.name || "tu agencia"}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Propiedades totales"
          value={data?.properties ?? 0}
          icon={Building2}
          description="En catálogo de la agencia"
          loading={isLoading}
        />
        <StatCard
          title="Disponibles"
          value={data?.available ?? 0}
          icon={CheckCircle2}
          description="Listas para venta o renta"
          loading={isLoading}
        />
        <StatCard
          title="Prospectos / Leads"
          value={data?.contacts ?? 0}
          icon={Users}
          description="Contactos registrados"
          loading={isLoading}
        />
        <StatCard
          title="Actividades"
          value={data?.activities ?? 0}
          icon={CalendarCheck}
          description="Citas, llamadas y tareas"
          loading={isLoading}
        />
      </div>
    </div>
  );
}
