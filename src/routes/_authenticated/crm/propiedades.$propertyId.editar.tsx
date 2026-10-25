import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FolderArchive } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyForm } from "@/components/property/PropertyForm";
import { PropertyBrochureButtons } from "@/components/property/PropertyBrochureButtons";
import { getPropertyById } from "@/integrations/firebase/services/properties.service";

export const Route = createFileRoute(
  "/_authenticated/crm/propiedades/$propertyId/editar",
)({
  component: EditPropertyPage,
});

function EditPropertyPage() {
  const { propertyId } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["crm-property", propertyId],
    queryFn: () => getPropertyById(propertyId),
  });

  return (
    <div>
      <PageHeader
        title="Editar propiedad"
        subtitle="Actualiza la información de la propiedad."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {data?.internal_id ? (
              <Button asChild variant="outline" size="sm">
                <Link
                  to="/crm/documentos/$internalId"
                  params={{ internalId: data.internal_id }}
                >
                  <FolderArchive className="h-4 w-4 mr-1.5" />
                  Documentos
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link to="/crm/propiedades">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Volver
              </Link>
            </Button>
          </div>
        }
      />
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error || !data ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
          No se encontró la propiedad solicitada.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <PropertyBrochureButtons propertyId={data.id} property={data as any} />
          </div>
          <PropertyForm property={data as any} isEdit />
        </div>
      )}
    </div>
  );
}
