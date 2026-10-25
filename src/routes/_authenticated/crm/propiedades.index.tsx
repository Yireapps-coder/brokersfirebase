import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  BedDouble,
  Bath,
  Car,
  ExternalLink,
  Plus,
  Pencil,
  ImageOff,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { coverThumbUrl, parsePropertyImages } from "@/lib/property-images";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  formatPrice,
  PROPERTY_TYPE_LABELS,
  OPERATION_LABELS,
  PROPERTY_STATUS_LABELS,
} from "@/lib/format";
import {
  getPropertiesByOrg,
  deleteProperty,
} from "@/integrations/firebase/services/properties.service";
import type { Property } from "@/integrations/firebase/types";

export const Route = createFileRoute("/_authenticated/crm/propiedades/")({
  component: PropertiesPage,
});

function PropertiesPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id ?? null;
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<Property | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["crm-properties", orgId],
    enabled: !!orgId,
    queryFn: () => getPropertiesByOrg(orgId!),
  });

  const deleteMutation = useMutation({
    mutationFn: async (property: Property) => {
      await deleteProperty(property.id);
    },
    onSuccess: () => {
      toast.success("Propiedad eliminada");
      setPendingDelete(null);
      queryClient.invalidateQueries({ queryKey: ["crm-properties", orgId] });
    },
    onError: (e) => {
      toast.error(
        e instanceof Error ? e.message : "No se pudo eliminar la propiedad",
      );
    },
  });

  return (
    <div>
      <PageHeader
        title="Propiedades"
        subtitle="Gestiona el inventario de tu agencia."
        action={
          <Button asChild size="sm">
            <Link to="/crm/propiedades/nueva">
              <Plus className="h-4 w-4" />
              Nueva propiedad
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <p className="text-sm font-medium text-foreground">
            No hay propiedades registradas aún.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Comienza agregando la primera propiedad al catálogo de tu agencia.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link to="/crm/propiedades/nueva">
              <Plus className="h-4 w-4 mr-1.5" />
              Crear propiedad
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => {
            const cover = coverThumbUrl(p.images);
            return (
              <Card key={p.id} className="overflow-hidden group">
                <div className="relative aspect-video w-full bg-muted overflow-hidden">
                  {cover ? (
                    <img
                      src={cover}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageOff className="h-8 w-8 opacity-40" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge variant="secondary" className="shadow">
                      {PROPERTY_STATUS_LABELS[p.status as keyof typeof PROPERTY_STATUS_LABELS] || p.status}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-foreground line-clamp-1">
                      {p.title}
                    </h4>
                    <span className="font-bold text-primary shrink-0">
                      {formatPrice(p.price || p.sale_price || p.rent_price, p.currency)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center gap-1 line-clamp-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {p.colonia ? `${p.colonia}, ` : ""}{p.city || "Ubicación pendiente"}
                  </p>

                  <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground border-t border-border">
                    {p.bedrooms != null && (
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-3.5 w-3.5" />
                        {p.bedrooms}
                      </span>
                    )}
                    {p.bathrooms != null && (
                      <span className="flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5" />
                        {p.bathrooms}
                      </span>
                    )}
                    {p.parking_spaces != null && (
                      <span className="flex items-center gap-1">
                        <Car className="h-3.5 w-3.5" />
                        {p.parking_spaces}
                      </span>
                    )}
                    {p.construction_area_m2 != null && (
                      <span>{p.construction_area_m2} m²</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3">
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/propiedades/$slug" params={{ slug: p.slug || p.id }} target="_blank">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Ver ficha
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/crm/propiedades/$propertyId/editar" params={{ propertyId: p.id }}>
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setPendingDelete(p)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar propiedad?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar permanentemente "{pendingDelete?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteMutation.mutate(pendingDelete);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
