import { Link } from "@tanstack/react-router";
import { BedDouble, Ruler, Layers, MapPin, ImageOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatPrice, formatNumber } from "@/lib/format";
import { propertyTypeLabel } from "@/lib/property-catalog";
import type { PropertyType } from "@/lib/property-catalog";
import type { PropertyCardData } from "@/lib/api/public.functions";

const OPERATION_SHORT: Record<string, string> = {
  venta: "Venta",
  renta: "Renta",
};

export function PropertyCard({ p }: { p: PropertyCardData }) {
  const location =
    [p.colonia, p.city, p.state].filter(Boolean).join(", ") || "Ubicación reservada";

  const opLabel = OPERATION_SHORT[p.operation_type] ?? p.operation_type;
  const typeLabel = propertyTypeLabel(p.property_type as PropertyType);

  const stats = [
    p.bedrooms ? { icon: BedDouble, label: `${p.bedrooms} rec.` } : null,
    p.construction_area_m2
      ? { icon: Ruler, label: `${formatNumber(p.construction_area_m2)} m²` }
      : null,
    p.floors_in_building
      ? {
          icon: Layers,
          label: `${p.floors_in_building} ${p.floors_in_building === 1 ? "nivel" : "niveles"}`,
        }
      : null,
  ].filter(Boolean) as { icon: typeof BedDouble; label: string }[];

  return (
    <Link
      to="/propiedades/$slug"
      params={{ slug: p.slug }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {p.cover_image ? (
          <img
            src={p.cover_image}
            alt={`${p.title} en ${location}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <ImageOff className="h-6 w-6" />
            <span className="text-xs">Sin imagen</span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge className="bg-primary text-primary-foreground shadow-sm">
            {opLabel} · {typeLabel}
          </Badge>
          {p.featured && (
            <Badge className="bg-accent text-accent-foreground shadow-sm">Destacada</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-foreground">
          {p.title}
        </h3>
        {p.internal_id && (
          <p className="mt-0.5 text-xs text-muted-foreground">IDP: {p.internal_id}</p>
        )}
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </p>

        {stats.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-foreground">
            {stats.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <s.icon className="h-4 w-4 text-primary" />
                {s.label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3">
          {p.publish_prices && p.price != null ? (
            <p className="text-lg font-bold text-primary">
              {formatPrice(p.price, p.currency)}
            </p>
          ) : (
            <p className="text-sm font-semibold text-muted-foreground">
              Precio a consultar
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
