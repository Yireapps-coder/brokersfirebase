import { MessageCircle } from "lucide-react";

import { buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * Floating WhatsApp button (mobile) prefilled with the property reference.
 * Respects the device safe-area inset at the bottom.
 */
export function PropertyWhatsAppFab({
  number,
  title,
  internalId,
}: {
  number: string | null | undefined;
  title: string;
  internalId: string | null;
}) {
  const idpSuffix = internalId ? ` (IDP: ${internalId})` : "";
  const message = `Hola, me interesa la propiedad ${title}${idpSuffix}`;
  const url = buildWhatsAppUrl(number, message);
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp sobre esta propiedad"
      className="fixed right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105 md:hidden"
      style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
