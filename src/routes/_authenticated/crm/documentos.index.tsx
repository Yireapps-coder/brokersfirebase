import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, FolderArchive, ImageOff, ArrowRight } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { coverThumbUrl } from "@/lib/property-images";
import { getPropertiesByOrg } from "@/integrations/firebase/services/properties.service";

export const Route = createFileRoute("/_authenticated/crm/documentos/")({
  component: DocumentosIndexPage,
});

function DocumentosIndexPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id ?? null;
  const [search, setSearch] = useState("");

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["crm-documentos-properties", orgId],
    enabled: !!orgId,
    queryFn: () => getPropertiesByOrg(orgId!),
  });

  const filtered = useMemo(() => {
    if (!properties) return [];
    const q = search.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter(
      (p) =>
        (p.internal_id ?? "").toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q)
    );
  }, [properties, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expedientes de Propiedades"
        subtitle="Administra la documentación legal y contratos de cada inmueble."
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID interno o título..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No se encontraron propiedades.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const cover = coverThumbUrl(p.images);
            return (
              <Card key={p.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 shrink-0 rounded-lg bg-muted overflow-hidden">
                      {cover ? (
                        <img src={cover} alt={p.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ImageOff className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] font-mono py-0">
                          {p.internal_id || p.id.slice(0, 6)}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-foreground text-sm truncate">{p.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.colonia ? `${p.colonia}, ` : ""}{p.city || "Ubicación pendiente"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex justify-end">
                    <Button asChild size="sm" variant="ghost">
                      <Link
                        to="/crm/documentos/$internalId"
                        params={{ internalId: p.internal_id || p.id }}
                      >
                        <FolderArchive className="h-3.5 w-3.5 mr-1.5" />
                        Ver expediente
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
