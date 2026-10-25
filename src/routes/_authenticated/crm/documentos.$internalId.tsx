import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyDocumentsSection } from "@/components/property/PropertyDocumentsSection";
import { getPropertiesByOrg } from "@/integrations/firebase/services/properties.service";

export const Route = createFileRoute(
  "/_authenticated/crm/documentos/$internalId",
)({
  component: PropertyDocumentsPage,
});

function PropertyDocumentsPage() {
  const { internalId } = Route.useParams();
  const { profile } = useAuth();
  const orgId = profile?.organization_id ?? null;

  const { data, isLoading, error } = useQuery({
    queryKey: ["crm-documentos-property", orgId, internalId],
    enabled: !!orgId,
    queryFn: async () => {
      const list = await getPropertiesByOrg(orgId!);
      return list.find((p) => p.internal_id === internalId || p.id === internalId) || null;
    },
  });

  return (
    <div>
      <PageHeader
        title="Documentos de propiedad"
        subtitle={
          data?.title
            ? `Expediente legal de “${data.title}”`
            : "Expediente legal de la propiedad."
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            {data?.internal_id ? (
              <Badge variant="outline" className="font-mono text-xs">
                {data.internal_id}
              </Badge>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link to="/crm/documentos">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Volver a Documentos
              </Link>
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : error || !data ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
          No se encontró la propiedad con identificador “{internalId}”.
        </div>
      ) : (
        <PropertyDocumentsSection propertyId={data.id} orgId={data.organization_id} />
      )}
    </div>
  );
}
