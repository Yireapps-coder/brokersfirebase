import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createPublicLead } from "@/integrations/firebase/services/contacts.service";

type Intent = "comprar" | "vender" | "rentar" | "broker";

const INTENT_OPTIONS: { value: Intent; label: string }[] = [
  { value: "comprar", label: "Comprar" },
  { value: "vender", label: "Vender" },
  { value: "rentar", label: "Rentar" },
  { value: "broker", label: "Soy Broker" },
];

export function LandingLeadForm({ orgId }: { orgId: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [intent, setIntent] = useState<Intent | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Ingresa tu nombre.");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    const national = digits.replace(/^52/, "");
    if (national.length !== 10) {
      toast.error("Ingresa un teléfono de 10 dígitos (incluye lada).");
      return;
    }
    if (!intent) {
      toast.error("Selecciona qué buscas.");
      return;
    }
    setSubmitting(true);
    try {
      await createPublicLead({
        organization_id: orgId,
        full_name: name.trim(),
        phone: phone.trim(),
        source: "facebook",
        message: `Intención: ${intent}`,
      });
      setDone(true);
    } catch {
      toast.error("No pudimos enviar tus datos. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-foreground">
          ¡Recibimos tus datos!
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Un asesor de nuestro equipo te contactará por WhatsApp en los próximos
          minutos.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="lead-name">Nombre completo</Label>
        <Input
          id="lead-name"
          placeholder="Ej. Juan Pérez"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lead-phone">Teléfono / WhatsApp</Label>
        <Input
          id="lead-phone"
          type="tel"
          placeholder="Ej. 222 123 4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <Label>¿Qué te interesa?</Label>
        <div className="grid grid-cols-2 gap-2">
          {INTENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setIntent(opt.value)}
              className={cn(
                "rounded-lg border p-3 text-center text-sm font-medium transition-colors",
                intent === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Contactar a un asesor"
        )}
      </Button>
    </form>
  );
}
