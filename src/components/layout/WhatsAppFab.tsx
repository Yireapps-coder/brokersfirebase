import { MessageCircle } from "lucide-react";

import { buildWhatsAppUrl } from "@/lib/whatsapp";

/** Sticky floating WhatsApp button, shown on mobile only. */
export function WhatsAppFab({ number }: { number: string | null | undefined }) {
  const url = buildWhatsAppUrl(number);
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105 md:hidden"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
