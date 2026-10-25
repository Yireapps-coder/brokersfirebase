import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MapPin, Phone, MessageCircle } from "lucide-react";

import { PublicShell } from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";
import { publicOrgQuery } from "@/lib/api/public.queries";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/contacto")({
  loader: ({ context }) => context.queryClient.ensureQueryData(publicOrgQuery()),
  head: ({ loaderData }) => {
    const name = loaderData?.name ?? "Inmobiliaria";
    const title = `Contacto — ${name}`;
    const description = `Ponte en contacto con ${name}. Te ayudamos a comprar, vender o rentar tu propiedad.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "/contacto" },
      ],
      links: [{ rel: "canonical", href: "/contacto" }],
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
  component: ContactoPage,
});

function ContactoPage() {
  const { data: org } = useSuspenseQuery(publicOrgQuery());
  const name = org?.name ?? "Nuestra agencia";
  const waUrl = buildWhatsAppUrl(
    org?.whatsapp_number,
    "Hola, me interesa una propiedad y quisiera más información.",
  );

  return (
    <PublicShell org={org}>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
          Contáctanos
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          ¿Quieres vender o rentar tu propiedad, o buscas tu próximo hogar? Escríbenos
          y un asesor de {name} te atenderá.
        </p>

        <div className="mt-8 space-y-3">
          {org?.address && (
            <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Dirección</p>
                <p className="text-sm text-muted-foreground">{org.address}</p>
              </div>
            </div>
          )}

          {org?.phone && (
            <a
              href={`tel:${org.phone}`}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
            >
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Teléfono</p>
                <p className="text-sm text-muted-foreground">{org.phone}</p>
              </div>
            </a>
          )}

          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
            >
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">WhatsApp</p>
                <p className="text-sm text-muted-foreground">
                  Chatea con nosotros ahora mismo
                </p>
              </div>
            </a>
          )}
        </div>

        {waUrl && (
          <Button asChild variant="hero" size="xl" className="mt-8 w-full sm:w-auto">
            <a href={waUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> Escríbenos por WhatsApp
            </a>
          </Button>
        )}

        {!org?.address && !org?.phone && !waUrl && (
          <p className="mt-8 rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
            Pronto publicaremos nuestros datos de contacto.
          </p>
        )}
      </div>
    </PublicShell>
  );
}
