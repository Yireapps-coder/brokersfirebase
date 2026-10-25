import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Building2, Target, HeartHandshake, ShieldCheck } from "lucide-react";

import { PublicShell } from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";
import { publicOrgQuery } from "@/lib/api/public.queries";

const VALUES = [
  {
    icon: Target,
    title: "Compromiso",
    desc: "Trabajamos para que encuentres la propiedad ideal en el menor tiempo posible.",
  },
  {
    icon: HeartHandshake,
    title: "Cercanía",
    desc: "Te acompañamos en cada paso, con asesoría clara y personalizada.",
  },
  {
    icon: ShieldCheck,
    title: "Confianza",
    desc: "Operaciones transparentes y seguras, respaldadas por nuestra experiencia.",
  },
];

export const Route = createFileRoute("/nosotros")({
  loader: ({ context }) => context.queryClient.ensureQueryData(publicOrgQuery()),
  head: ({ loaderData }) => {
    const name = loaderData?.name ?? "Inmobiliaria";
    const title = `Nosotros — ${name}`;
    const description = `Conoce a ${name}, tu aliado inmobiliario. Asesoría profesional en compra, venta y renta de propiedades.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "/nosotros" },
      ],
      links: [{ rel: "canonical", href: "/nosotros" }],
    };
  },
  errorComponent: ({ reset }) => {
    const router = useRouter();
    return (
      <PublicShell org={null}>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Algo salió mal</h1>
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
  component: NosotrosPage,
});

function NosotrosPage() {
  const { data: org } = useSuspenseQuery(publicOrgQuery());
  const name = org?.name ?? "Nuestra agencia";

  return (
    <PublicShell org={org}>
      <div className="mx-auto max-w-3xl text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
          Sobre {name}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Somos una agencia inmobiliaria dedicada a ayudarte a comprar, vender o rentar
          tu propiedad con la mejor asesoría. Conocemos el mercado local y ponemos
          nuestra experiencia a tu servicio.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {VALUES.map((v) => (
          <div
            key={v.title}
            className="rounded-xl border border-border bg-card p-6 text-center"
          >
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <v.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-foreground">{v.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
          </div>
        ))}
      </div>
    </PublicShell>
  );
}
