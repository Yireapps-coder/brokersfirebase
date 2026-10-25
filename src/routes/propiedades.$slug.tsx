import {
  createFileRoute,
  Link,
  notFound,
  useRouter,
} from "@tanstack/react-router";
import {
  MapPin,
  BedDouble,
  Bath,
  Car,
  Ruler,
  Layers,
  CheckCircle2,
} from "lucide-react";

import { useSuspenseQuery } from "@tanstack/react-query";

import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PropertyWhatsAppFab } from "@/components/layout/PropertyWhatsAppFab";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { PropertyLeadForm } from "@/components/property/PropertyLeadForm";
import { PublicBrochureButton } from "@/components/property/PublicBrochureButton";
import { PropertyLocationMap } from "@/components/property/PropertyLocationMap";
import { PropertyCard } from "@/components/property/PropertyCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublicProperty, getRelatedProperties, getPublicPropertyContact } from "@/lib/api/public.functions";
import { publicOrgQuery } from "@/lib/api/public.queries";

import type { PublicOrg, PropertyCardData } from "@/lib/api/public.functions";
import {
  orgHeadingsClass,
  orgThemeStyle,
  parseOrgTheme,
} from "@/lib/org-theme";
import { formatPrice, formatNumber, OPERATION_LABELS } from "@/lib/format";
import {
  propertyTypeLabel,
  amenityLabel,
  categoryForPropertyType,
  isFieldVisible,
  financingOptionLabel,
  AMENITY_GROUPS,
} from "@/lib/property-catalog";
import type { PropertyType } from "@/lib/property-catalog";

import { galleryFullUrls, coverFullUrl } from "@/lib/property-images";
import {
  parseMediaLinks,
  getEmbedUrl,
  mediaPlatformLabel,
} from "@/lib/media-links";
import { PlayCircle, ExternalLink } from "lucide-react";


// Amenity sections in the order requested for the public page.
const AMENITY_SECTION_ORDER = [
  "exterior",
  "general",
  "recreation",
  "policy",
  "visitor_parking",
];

export const Route = createFileRoute("/propiedades/$slug")({
  loader: async ({ params, context }) => {
    const [property] = await Promise.all([
      getPublicProperty(params.slug),
      context.queryClient.ensureQueryData(publicOrgQuery()),
    ]);
    if (!property) throw notFound();

    const related = await getRelatedProperties({
      data: {
        propertyId: property.id,
        organizationId: property.organization_id,
        propertyType: property.property_type,
        city: property.city ?? undefined,
      },
    }).catch(() => []);

    const contact = await getPublicPropertyContact({
      data: { propertyId: property.id },
    }).catch(() => null);

    return { property, related, contact };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.property;
    if (!p) {
      return { meta: [{ title: "Propiedad no encontrada — Brokers" }] };
    }
    const location = [p.city, p.state].filter(Boolean).join(", ");
    const title = `${p.title}${location ? ` en ${location}` : ""} — Brokers`;
    const description =
      p.description?.slice(0, 155) ??
      `${propertyTypeLabel(p.property_type) ?? "Propiedad"} ${
        OPERATION_LABELS[p.operation_type] ?? ""
      }${location ? ` en ${location}` : ""}. ${formatPrice(p.price, p.currency)}.`;
    const image = coverFullUrl(p.images);

    const meta = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `/propiedades/${p.slug}` },
      ...(image
        ? [
            { property: "og:image", content: image },
            { name: "twitter:image", content: image },
            { name: "twitter:card", content: "summary_large_image" },
          ]
        : []),
    ];

    // RealEstateListing structured data for rich results.
    const jsonLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: p.title,
      description: p.description ?? description,
      url: `/propiedades/${p.slug}`,
      ...(image ? { image } : {}),
      ...(location ? { address: location } : {}),
      ...(p.public_latitude != null && p.public_longitude != null
        ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: Number(p.public_latitude),
              longitude: Number(p.public_longitude),
            },
          }
        : {}),
      ...(p.publish_prices && p.price != null
        ? {
            offers: {
              "@type": "Offer",
              price: Number(p.price),
              priceCurrency: p.currency ?? "MXN",
              availability: "https://schema.org/InStock",
            },
          }
        : {}),
    };

    return {
      meta,
      links: [{ rel: "canonical", href: `/propiedades/${p.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(jsonLd),
        },
      ],
    };
  },
  errorComponent: ({ reset }) => {
    const router = useRouter();
    return (
      <PublicShell org={null}>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Algo salió mal</h1>
          <p className="mt-2 text-muted-foreground">
            No pudimos cargar esta propiedad. Inténtalo de nuevo.
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              reset();
              router.invalidate();
            }}
          >
            Reintentar
          </Button>
        </div>
      </PublicShell>
    );
  },
  notFoundComponent: () => (
    <PublicShell org={null}>
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Propiedad no encontrada
        </h1>
        <p className="mt-2 text-muted-foreground">
          La propiedad que buscas no está disponible o no existe.
        </p>
        <Button asChild variant="accent" className="mt-6">
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    </PublicShell>
  ),
  component: PropertyDetailPage,
});

function PublicShell({
  org,
  children,
}: {
  org: PublicOrg | null;
  children: React.ReactNode;
}) {
  const theme = parseOrgTheme(org?.theme ?? null);
  return (
    <div
      className={`flex min-h-screen flex-col bg-background ${orgHeadingsClass(theme)}`}
      style={orgThemeStyle(theme, "public")}
    >
      <PublicHeader org={org} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
      <PublicFooter org={org} />
    </div>
  );
}

function PropertyDetailPage() {
  const { property: p, related, contact } = Route.useLoaderData();
  const { data: org } = useSuspenseQuery(publicOrgQuery());

  const images = galleryFullUrls(p.images);
  const mediaLinks = parseMediaLinks(
    (p as { media_links?: unknown }).media_links,
  );
  const category = categoryForPropertyType(p.property_type as PropertyType);
  const typeLabel = propertyTypeLabel(p.property_type as PropertyType);

  const location =
    [p.colonia, p.city, p.state].filter(Boolean).join(", ") ||
    "Ubicación sin especificar";

  // Key stats — only relevant fields for this category.
  const stats = [
    isFieldVisible("bedrooms", category) && p.bedrooms
      ? { icon: BedDouble, label: `${p.bedrooms} rec.` }
      : null,
    isFieldVisible("bathrooms", category) && p.bathrooms
      ? { icon: Bath, label: `${formatNumber(p.bathrooms)} baños` }
      : null,
    isFieldVisible("parking_spaces", category) && p.parking_spaces
      ? { icon: Car, label: `${p.parking_spaces} estac.` }
      : null,
    isFieldVisible("construction_area_m2", category) && p.construction_area_m2
      ? { icon: Ruler, label: `${formatNumber(p.construction_area_m2)} m² const.` }
      : null,
    p.land_area_m2
      ? { icon: Ruler, label: `${formatNumber(p.land_area_m2)} m² terreno` }
      : null,
    isFieldVisible("floors_in_building", category) && p.floors_in_building
      ? {
          icon: Layers,
          label: `${p.floors_in_building} ${
            p.floors_in_building === 1 ? "nivel" : "niveles"
          }`,
        }
      : null,
  ].filter(Boolean) as { icon: typeof BedDouble; label: string }[];

  // Secondary detail rows (respect category visibility + presence).
  const details = [
    isFieldVisible("year_built", category) && p.year_built
      ? { label: "Año de construcción", value: String(p.year_built) }
      : null,
    isFieldVisible("unit_floor", category) && p.unit_floor
      ? { label: "Piso", value: String(p.unit_floor) }
      : null,
    isFieldVisible("uncovered_area_m2", category) && p.uncovered_area_m2
      ? {
          label: "Superficie no cubierta",
          value: `${formatNumber(p.uncovered_area_m2)} m²`,
        }
      : null,
    isFieldVisible("maintenance_fee_monthly", category) &&
    p.maintenance_fee_monthly
      ? {
          label: "Mantenimiento mensual",
          value: `${formatPrice(p.maintenance_fee_monthly, p.currency)}/mes`,
        }
      : null,
    isFieldVisible("half_bathrooms", category) && p.half_bathrooms
      ? { label: "Medios baños", value: String(p.half_bathrooms) }
      : null,
    p.conservation_state
      ? { label: "Conservación", value: p.conservation_state }
      : null,
    p.disposition ? { label: "Disposición", value: p.disposition } : null,
    p.orientation ? { label: "Orientación", value: p.orientation } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  // Amenities grouped by section, in the requested display order.
  const selectedAmenities: string[] =
    Array.isArray(p.amenity_ids) && p.amenity_ids.length > 0
      ? p.amenity_ids
      : Array.isArray(p.amenities)
        ? p.amenities
        : [];
  const amenitySet = new Set(selectedAmenities);
  const amenitySections = AMENITY_SECTION_ORDER.map((cat) => {
    const group = AMENITY_GROUPS.find((g) => g.category === cat);
    if (!group) return null;
    const items = group.options.filter((o) => amenitySet.has(o.id));
    return items.length > 0 ? { label: group.label, items } : null;
  }).filter(Boolean) as {
    label: string;
    items: { id: string; label: string }[];
  }[];

  // Financing: only for residential sales.
  const showFinancing =
    category === "residential" && p.operation_type === "venta";
  const financingOptions: string[] = Array.isArray(p.financing_option_ids)
    ? p.financing_option_ids
    : [];

  const hasCoords = p.public_latitude != null && p.public_longitude != null;
  const isExact = p.location_precision === "exact";

  return (
    <PublicShell org={org}>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Inicio</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/propiedades">Propiedades</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/propiedades" search={{ type: p.property_type }}>
                {typeLabel}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="line-clamp-1 max-w-[200px]">
              {p.title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PropertyGallery images={images} title={p.title} city={p.city} />

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{OPERATION_LABELS[p.operation_type]}</Badge>
            <Badge>{typeLabel}</Badge>
            <span className="text-xs text-muted-foreground">Folio {p.folio}</span>
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {p.title}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            {location}
          </p>

          <div className="mt-4">
            {p.publish_prices ? (
              <p className="text-2xl font-bold text-primary md:text-3xl">
                {formatPrice(p.price, p.currency)}
                {p.price_based_on === "per_m2" && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    /m²
                  </span>
                )}
              </p>
            ) : (
              <p className="text-xl font-semibold text-muted-foreground">
                Precio a consultar
              </p>
            )}
          </div>

          <div className="mt-4">
            <PublicBrochureButton property={p} org={org} contact={contact} />
          </div>


          {stats.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
              {stats.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground"
                >
                  <s.icon className="h-4 w-4 text-primary" />
                  {s.label}
                </span>
              ))}
            </div>
          )}

          {p.description && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-foreground">
                Descripción
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            </section>
          )}

          {mediaLinks.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-foreground">
                Videos y recorridos
              </h2>
              <div className="mt-3 space-y-4">
                {mediaLinks.map((link, i) => {
                  const embed = getEmbedUrl(link.url);
                  if (embed) {
                    return (
                      <div key={i}>
                        {link.title && (
                          <p className="mb-2 text-sm font-medium text-foreground">
                            {link.title}
                          </p>
                        )}
                        <div className="aspect-video w-full overflow-hidden rounded-xl border border-border">
                          <iframe
                            src={embed}
                            title={link.title || `Video ${i + 1}`}
                            className="h-full w-full"
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    );
                  }
                  return (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted"
                    >
                      <span className="flex items-center gap-2 text-foreground">
                        <PlayCircle className="h-4 w-4 text-accent" />
                        {link.title || `Ver en ${mediaPlatformLabel(link.url)}`}
                      </span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          {details.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-foreground">Detalles</h2>
              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {details.map((d) => (
                  <div
                    key={d.label}
                    className="flex items-center justify-between border-b border-border py-1.5 text-sm"
                  >
                    <dt className="text-muted-foreground">{d.label}</dt>
                    <dd className="font-medium text-foreground">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {amenitySections.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-foreground">Amenidades</h2>
              <div className="mt-3 space-y-5">
                {amenitySections.map((section) => (
                  <div key={section.label}>
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {section.label}
                    </h3>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {section.items.map((a) => (
                        <li
                          key={a.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground"
                        >
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          {amenityLabel(a.id)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {showFinancing && (p.financing_terms || financingOptions.length > 0) && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-foreground">
                Condiciones de financiamiento
              </h2>
              {financingOptions.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {financingOptions.map((id) => (
                    <li
                      key={id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                      {financingOptionLabel(id)}
                    </li>
                  ))}
                </ul>
              )}
              {p.financing_terms && (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {p.financing_terms}
                </p>
              )}
            </section>
          )}

          {hasCoords && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-foreground">Ubicación</h2>
              {isExact && p.address && (
                <p className="mt-1 text-sm text-muted-foreground">{p.address}</p>
              )}
              <div className="mt-3">
                <PropertyLocationMap
                  latitude={Number(p.public_latitude)}
                  longitude={Number(p.public_longitude)}
                  exact={isExact}
                />
                {!isExact && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    Ubicación aproximada. Solicita la dirección exacta a un asesor.
                  </p>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <PropertyLeadForm propertyId={p.id} propertyTitle={p.title} />
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-foreground">
            Propiedades similares
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((rp: PropertyCardData) => (
              <PropertyCard key={rp.id} p={rp} />
            ))}
          </div>
        </section>
      )}

      <PropertyWhatsAppFab
        number={org?.whatsapp_number}
        title={p.title}
        internalId={p.internal_id ?? null}
      />
    </PublicShell>
  );
}

