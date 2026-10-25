import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import type { PublicOrg } from "@/lib/api/public.functions";

type NavLink = { to: "/" | "/propiedades" | "/nosotros" | "/contacto"; label: string };

const NAV: NavLink[] = [
  { to: "/", label: "Inicio" },
  { to: "/propiedades", label: "Propiedades" },
  { to: "/nosotros", label: "Nosotros" },
  { to: "/contacto", label: "Contacto" },
];

function Brand({ org }: { org: PublicOrg | null }) {
  const name = org?.name ?? "Inmobiliaria";
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label={`${name} — Inicio`}>
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
    </Link>
  );
}

export function PublicHeader({ org }: { org: PublicOrg | null }) {
  const [open, setOpen] = useState(false);
  const waUrl = buildWhatsAppUrl(org?.whatsapp_number);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Brand org={org} />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {waUrl && (
            <Button asChild variant="hero" className="hidden sm:inline-flex">
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Abrir menú">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-6 flex flex-col gap-1">
                {NAV.map((item) => (
                  <SheetClose asChild key={item.to}>
                    <Link
                      to={item.to}
                      activeOptions={{ exact: item.to === "/" }}
                      className="rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                      activeProps={{ className: "bg-muted" }}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </div>
              {waUrl && (
                <Button asChild variant="hero" className="mt-6 w-full">
                  <a href={waUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
