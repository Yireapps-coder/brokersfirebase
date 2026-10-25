import { useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { SearchX, SlidersHorizontal, LayoutGrid, Map as MapIcon } from "lucide-react";

import { PublicShell } from "@/components/layout/PublicShell";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyFilters } from "@/components/property/PropertyFilters";
import { PropertiesMap } from "@/components/property/PropertiesMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  publicOrgQuery,
  publicPropertiesQuery,
  propertyPointsQuery,
  orgColoniasQuery,
} from "@/lib/api/public.queries";
import {
  SORT_OPTIONS,
  activeFilterCount,
  type PropertySearchFilters,
  type SortOption,
} from "@/lib/property-filters";

const searchSchema = z.object({
  q: fallback(z.string().optional(), undefined),
  operation: fallback(z.enum(["venta", "renta"]).optional(), undefined),
  type: fallback(z.string().optional(), undefined),
  city: fallback(z.string().optional(), undefined),
  priceMin: fallback(z.coerce.number().optional(), undefined),
  priceMax: fallback(z.coerce.number().optional(), undefined),
  bedrooms: fallback(z.string().optional(), undefined),
  land: fallback(z.string().optional(), undefined),
  colonia: fallback(z.string().optional(), undefined),
  sort: fallback(z.enum(["recent", "price_asc", "price_desc"]).optional(), undefined),
});

export const Route = createFileRoute("/propiedades/")({
  validateSearch: zodValidator(searchSchema),
  loader: async ({ context }) => {
    const org = await context.queryClient.ensureQueryData(publicOrgQuery());
    return { orgName: org?.name ?? "Inmobiliaria" };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.orgName ?? "Inmobiliaria";
    const title = `Propiedades en venta y renta — ${name}`;
    const description = `Explora el catálogo de casas, departamentos y terrenos en venta y renta de ${name}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: "/propiedades" }],
    };
  },
  component: PropertiesPage,
});

function PropertiesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: org } = useSuspenseQuery(publicOrgQuery());
  const orgId = org?.id;

  const [view, setView] = useState<"list" | "map">("list");
  const [sheetOpen, setSheetOpen] = useState(false);

  const filters: PropertySearchFilters = search;

  const coloniasQuery = useQuery({
    ...orgColoniasQuery(orgId || "agencia_principal"),
    enabled: Boolean(orgId),
  });

  const listQuery = useQuery({
    ...publicPropertiesQuery(orgId, filters),
    enabled: true,
  });

  const pointsQuery = useQuery({
    ...propertyPointsQuery(orgId),
    enabled: view === "map",
  });

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const count = activeFilterCount(filters);

  const update = (patch: Partial<PropertySearchFilters>) =>
    navigate({ to: ".", search: (prev) => ({ ...prev, ...patch }) });

  const clearFilters = () =>
    navigate({ to: ".", search: (prev) => ({ sort: prev.sort }) });

  return (
    <PublicShell org={org}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Propiedades disponibles
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {listQuery.isLoading
                ? "Buscando propiedades..."
                : `${total} ${total === 1 ? "propiedad encontrada" : "propiedades encontradas"}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border bg-card p-1">
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
                className="h-8 px-2.5"
              >
                <LayoutGrid className="mr-1.5 h-4 w-4" />
                Cuadrícula
              </Button>
              <Button
                variant={view === "map" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("map")}
                className="h-8 px-2.5"
              >
                <MapIcon className="mr-1.5 h-4 w-4" />
                Mapa
              </Button>
            </div>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 lg:hidden">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filtros
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1.5 px-1.5 py-0">
                      {count}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] overflow-y-auto sm:w-[380px]">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <PropertyFilters
                    filters={filters}
                    onChange={(p) => {
                      update(p);
                      setSheetOpen(false);
                    }}
                    onClear={() => {
                      clearFilters();
                      setSheetOpen(false);
                    }}
                    colonias={coloniasQuery.data ?? []}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <Select
              value={filters.sort || "recent"}
              onValueChange={(val: SortOption) => update({ sort: val })}
            >
              <SelectTrigger className="h-10 w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <aside className="hidden lg:block">
            <div className="sticky top-20 rounded-xl border border-border bg-card p-5">
              <PropertyFilters
                filters={filters}
                onChange={update}
                onClear={clearFilters}
                colonias={coloniasQuery.data ?? []}
              />
            </div>
          </aside>

          <div className="lg:col-span-3">
            {view === "map" ? (
              <div className="h-[600px] overflow-hidden rounded-xl border border-border">
                <PropertiesMap points={pointsQuery.data ?? []} />
              </div>
            ) : listQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
                <SearchX className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  No se encontraron propiedades
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Prueba cambiando o limpiando los filtros seleccionados.
                </p>
                {count > 0 && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                    Limpiar todos los filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((card) => (
                  <PropertyCard key={card.id} property={card} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
