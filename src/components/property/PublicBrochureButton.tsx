import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type {
  PublicOrg,
  PublicPropertyContact,
} from "@/lib/api/public.functions";
import type { BrochureContact } from "@/lib/property-brochure";

/**
 * Public portal brochure download. Always produces the "with contact" variant
 * — the goal is for the lead to reach the assigned agent. The no-contact
 * variant is intentionally never exposed here. The agent contact is resolved
 * server-side in the route loader (security-definer, marketing-safe fields).
 */
export function PublicBrochureButton({
  property,
  org,
  contact,
}: {
  property: Record<string, unknown> & { id: string };
  org: PublicOrg | null;
  contact: PublicPropertyContact | null;
}) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    if (!org) return;
    setBusy(true);
    try {
      const brochureContact: BrochureContact = {
        orgName: contact?.orgName || org.name,
        agentName: contact?.agentName ?? null,
        agentPhone: contact?.agentPhone ?? null,
        agentWhatsapp:
          contact?.agentWhatsapp ??
          org.whatsapp_number ??
          contact?.agentPhone ??
          null,
      };

      const { downloadPropertyBrochure } = await import(
        "@/lib/property-brochure"
      );
      await downloadPropertyBrochure({
        property,
        org: {
          name: org.name,
          logo_url: org.logo_url,
          theme: org.theme,
          whatsapp_number: org.whatsapp_number,
        },
        contact: brochureContact,
        isPublic: true,
      });
    } catch (err) {
      console.error("brochure generation failed", err);
      toast.error("No se pudo generar la ficha técnica.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleDownload} disabled={busy}>
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      Descargar ficha técnica
    </Button>
  );
}
