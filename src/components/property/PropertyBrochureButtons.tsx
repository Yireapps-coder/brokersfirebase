import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileDown, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { BrochureContact, BrochureOrg } from "@/lib/property-brochure";
import { getOrganizationById } from "@/integrations/firebase/services/organizations.service";
import { getProfileById } from "@/integrations/firebase/services/team.service";

type PropertyRow = Record<string, unknown> & {
  id: string;
  organization_id: string;
  agent_id?: string | null;
};

export function PropertyBrochureButtons({
  propertyId,
  property,
}: {
  propertyId?: string;
  property: PropertyRow;
}) {
  const [busy, setBusy] = useState<null | "with" | "without">(null);

  const { data: org } = useQuery({
    queryKey: ["brochure-org", property.organization_id],
    enabled: !!property.organization_id,
    queryFn: async (): Promise<BrochureOrg | null> => {
      const o = await getOrganizationById(property.organization_id);
      if (!o) return null;
      return {
        name: o.name,
        logo_url: o.logo_url ?? null,
        theme: o.theme ?? null,
        whatsapp_number: o.whatsapp_number ?? null,
      };
    },
  });

  const { data: agent } = useQuery({
    queryKey: ["brochure-agent", property.agent_id],
    enabled: !!property.agent_id,
    queryFn: async () => {
      if (!property.agent_id) return null;
      return await getProfileById(property.agent_id);
    },
  });

  const download = async (withContact: boolean) => {
    setBusy(withContact ? "with" : "without");
    try {
      const { downloadPropertyBrochure } = await import("@/lib/property-brochure");
      const contact: BrochureContact | null =
        withContact && agent
          ? {
              full_name: agent.full_name || "Asesor Inmobiliario",
              phone: agent.phone || org?.whatsapp_number || "",
            }
          : null;

      await downloadPropertyBrochure({
        property: property as any,
        org: org ?? null,
        contact,
      });
      toast.success("Ficha técnica generada correctamente.");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo generar la ficha técnica"
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy !== null}
        onClick={() => download(true)}
      >
        {busy === "with" ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileDown className="mr-1.5 h-3.5 w-3.5" />
        )}
        Descargar ficha técnica
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={busy !== null}
        onClick={() => download(false)}
      >
        {busy === "without" ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileText className="mr-1.5 h-3.5 w-3.5" />
        )}
        Ficha sin contacto
      </Button>
    </div>
  );
}
