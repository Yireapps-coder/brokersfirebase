import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { ArrowRight, Home as HomeIcon, Building2, Search } from "lucide-react";

import { PublicShell } from "@/components/layout/PublicShell";
import { PropertyCard } from "@/components/property/PropertyCard";
import { HeroSearch } from "@/components/portal/HeroSearch";
import { Button } from "@/components/ui/button";
import { publicOrgQuery, homePropertiesQuery } from "@/lib/api/public.queries";
import type { PublicOrg, PropertyCardData } from "@/lib/api/public.functions";
import heroImage from "@/assets/hero-home.jpg";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const org = await context.queryClient.ensureQueryData(publicOrgQuery());
    if (org) {
      await context.queryClient.ensureQueryData(homePropertiesQuery(org.id));
    }
    return { orgName: org?.name ?? "Inmobiliaria" };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.orgName ?? "Inmobiliaria";
    const title = `${name} — Propiedades en venta y renta`;
    const description = `Descubre propiedades en venta y renta con ${name}. Casas, departamentos, terrenos y más, listos para ti.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "/" },
        { property: "og:image", content: heroImage },
        { name: "twitter:image", content: heroImage },
      ],
      links: [{ rel: "canonical", href: "/" }],
    };
  },
  errorComponent: ({ reset }) => {
    const router = useRouter();
    return (
      <PublicShell org={null}>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Algo salió mal</h1>
          <p className="mt-2 text-muted-foreground">
            No pudimos cargar la página. Inténtalo de nuevo.
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
        <h1 className="text-2xl font-bold text-foreground">Página no encontrada</h1>
      </div>
    </PublicShell>
  ),
  component: HomePage,
});

function HomePage() {
  const { data: org } = useSuspenseQuery(publicOrgQuery());
  const homeQuery = useQuery({
    ...homePropertiesQuery(org?.id ?? "00000000-0000-0000-0000-000000000000"),
    enabled: Boolean(org),
  });
  const featured: PropertyCardData[] = homeQuery.data?.featured ?? [];
  const recent: PropertyCardData[] = homeQuery.data?.recent ?? [];

  return (
    <PublicShell org={org} contained={false}>
      <Hero org={org} />

      {featured.length > 0 && (
        <Section
          title="Propiedades destacadas"
          subtitle="Una selección de lo mejor de nuestro catálogo."
          items={featured}
        />
      )}

      {recent.length > 0 && (
        <Section
          title="Más recientes"
          subtitle="Las últimas propiedades que agregamos."
          items={recent}
          tinted
        />
      )}

      {featured.length === 0 && recent.length === 0 && (
        <div className="mx-auto max-w-6xl px-4 py-20 text-center md:px-6">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold text-foreground">
            Próximamente nuevas propiedades
          </h2>
          <p className="mt-2 text-muted-foreground">
            Estamos preparando nuestro catálogo. Vuelve pronto.
          </p>
        </div>
      )}

      <CtaBlock />
    </PublicShell>
  );
}

function Hero({ org }: { org: PublicOrg | null }) {
  const coverImage = org?.hero_image_url || heroImage;
  const overlayOpacity =
    org?.hero_overlay_opacity == null ? 0.8 : org.hero_overlay_opacity;
  const overlayColor = org?.hero_overlay_color || "#1B4F8A";
  return (
    <section className="relative overflow-hidden border-b border-border">
      <img
        src={coverImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: overlayColor, opacity: overlayOpacity }}
      />

      <div className="relative mx-auto max-w-4xl px-4 py-16 text-center md:px-6 md:py-24">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-primary-foreground md:text-5xl">
          Encuentra tu próxima propiedad
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-primary-foreground/90 md:text-lg">
          {org?.name ?? "Nuestra agencia"} te acompaña en la compra, venta y renta de
          inmuebles.
        </p>
        <div className="mx-auto mt-8 max-w-3xl text-left">
          <HeroSearch />
        </div>
      </div>
    </section>
  );
}

function Section({
  title,
  subtitle,
  items,
  tinted,
}: {
  title: string;
  subtitle: string;
  items: PropertyCardData[];
  tinted?: boolean;
}) {
  return (
    <section className={tinted ? "border-y border-border bg-card" : ""}>
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {title}
            </h2>
            <p className="mt-1 text-muted-foreground">{subtitle}</p>
          </div>
          <Link
            to="/propiedades"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <PropertyCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBlock() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <div className="rounded-2xl bg-primary px-6 py-12 text-center md:px-12">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground">
          <HomeIcon className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-2xl font-bold text-primary-foreground md:text-3xl">
          ¿Quieres vender o rentar tu propiedad?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-primary-foreground/80">
          Contáctanos y un asesor te ayudará a publicar tu inmueble y encontrar al
          comprador o inquilino ideal.
        </p>
        <Button asChild variant="hero" size="xl" className="mt-6">
          <Link to="/contacto">
            <Search className="h-4 w-4" /> Contáctanos
          </Link>
        </Button>
      </div>
    </section>
  );
}
