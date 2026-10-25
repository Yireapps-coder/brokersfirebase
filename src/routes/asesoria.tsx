import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BadgeCheck, Clock, HeartHandshake } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LandingLeadForm } from "@/components/portal/LandingLeadForm";
import { publicOrgQuery } from "@/lib/api/public.queries";
import {
  orgHeadingsClass,
  orgThemeStyle,
  parseOrgTheme,
} from "@/lib/org-theme";
import { useTenantFavicon } from "@/hooks/use-tenant-favicon";



export const Route = createFileRoute("/asesoria")({
  loader: ({ context }) => context.queryClient.ensureQueryData(publicOrgQuery()),
  head: ({ loaderData }) => {
    const name = loaderData?.name ?? "Inmobiliaria";
    const title = `Asesoría inmobiliaria — ${name}`;
    const description =
      "¿Quieres comprar, vender o rentar una propiedad? Déjanos tus datos y un asesor te contactará. Asesoría personalizada y sin compromiso.";
    const meta = [
      { title },
      { name: "description", content: description },
      // Paid-traffic landing page — should not be indexed by search engines.
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ];
    if (loaderData?.logo_url) {
      meta.push({ property: "og:image", content: loaderData.logo_url });
    }
    return { meta };
  },
  errorComponent: ({ reset }) => {
    const router = useRouter();
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">Algo salió mal</h1>
        <Button
          onClick={() => {
            reset();
            router.invalidate();
          }}
        >
          Reintentar
        </Button>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <h1 className="text-2xl font-bold text-foreground">Página no encontrada</h1>
    </div>
  ),
  component: AsesoriaLandingPage,
});

const VALUE_PROPS = [
  { icon: HeartHandshake, label: "Asesoría personalizada" },
  { icon: BadgeCheck, label: "Sin compromiso" },
  { icon: Clock, label: "Respuesta rápida" },
];

function AsesoriaLandingPage() {
  const { data: org } = useSuspenseQuery(publicOrgQuery());
  const theme = parseOrgTheme(org?.theme ?? null);
  const name = org?.name ?? "Inmobiliaria";
  useTenantFavicon(org?.logo_url);

  return (
    <div
      className={`flex min-h-screen flex-col bg-background ${orgHeadingsClass(theme)}`}
      style={orgThemeStyle(theme, "public")}
    >
      {/* Minimal header: only the tenant logo, no navigation */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-2.5 px-4 md:px-6">
          {org?.logo_url && (
            <img
              src={org.logo_url}
              alt={name}
              className="h-9 max-h-9 w-auto object-contain"
              style={{ maxWidth: 140 }}
            />
          )}
          <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">
            {name}
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 md:grid-cols-2 md:items-center md:gap-12 md:px-6 md:py-16">
          {/* Copy + value props */}
          <div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-primary sm:text-4xl md:text-[2.75rem]">
              ¿Quieres comprar, vender o rentar una propiedad? Te ayudamos.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Un asesor de {name} te acompaña en cada paso. Déjanos tus datos y
              te contactamos hoy mismo.
            </p>

            <ul className="mt-8 space-y-3">
              {VALUE_PROPS.map((vp) => (
                <li key={vp.label} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <vp.icon className="h-5 w-5" />
                  </span>
                  <span className="font-medium text-foreground">{vp.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Conversion form */}
          <div>
            <LandingLeadForm orgId={org?.id ?? ""} />
          </div>
        </div>
      </main>
    </div>
  );
}
