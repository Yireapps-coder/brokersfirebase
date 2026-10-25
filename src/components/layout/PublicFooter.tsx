import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Facebook, Instagram, Linkedin, Music2 } from "lucide-react";

import { buildWhatsAppUrl } from "@/lib/whatsapp";
import type { PublicOrg } from "@/lib/api/public.functions";

export function PublicFooter({ org }: { org: PublicOrg | null }) {
  const name = org?.name ?? "Inmobiliaria";
  const waUrl = buildWhatsAppUrl(org?.whatsapp_number);

  const social = [
    { icon: Facebook, label: "Facebook", href: org?.facebook_url },
    { icon: Instagram, label: "Instagram", href: org?.instagram_url },
    { icon: Linkedin, label: "LinkedIn", href: org?.linkedin_url },
    { icon: Music2, label: "TikTok", href: org?.tiktok_url },
  ].filter((s) => s.href && s.href.trim());

  const legalLinks = [
    { label: "Aviso de privacidad", href: org?.privacy_url },
    { label: "Términos y condiciones", href: org?.terms_url },
  ].filter((l) => l.href && l.href.trim());

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            {org?.logo_url ? (
              <img
                src={org.logo_url}
                alt={name}
                className="h-10 w-auto object-contain"
                style={{ maxWidth: 180 }}
              />
            ) : (
              <span className="text-lg font-bold text-foreground">{name}</span>
            )}
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Encuentra tu próxima propiedad con nosotros.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Contacto</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {org?.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{org.address}</span>
                </li>
              )}
              {org?.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  <a href={`tel:${org.phone}`} className="hover:text-foreground">
                    {org.phone}
                  </a>
                </li>
              )}
              {waUrl && (
                <li>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground"
                  >
                    WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Links */}
          <div>
            {social.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-foreground">Síguenos</h3>
                <div className="mt-3 flex gap-2">
                  {social.map((s) => (
                    <a
                      key={s.label}
                      href={s.href ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <s.icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </>
            )}
            {legalLinks.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                {legalLinks.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {name}. Todos los derechos reservados.
          </p>
          <Link to="/" className="hover:text-foreground">
            Inicio
          </Link>
        </div>
      </div>
    </footer>
  );
}
