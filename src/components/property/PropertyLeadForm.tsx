import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPublicLead } from "@/integrations/firebase/services/contacts.service";

export function PropertyLeadForm({
  propertyId,
  propertyTitle,
  orgId,
}: {
  propertyId: string;
  propertyTitle: string;
  orgId?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: `Me interesa la propiedad: ${propertyTitle}`,
  });

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error("Ingresa tu nombre.");
      return;
    }
    if (form.phone.replace(/\D/g, "").length < 7) {
      toast.error("Ingresa un teléfono válido.");
      return;
    }
    setSubmitting(true);
    try {
      await createPublicLead({
        organization_id: orgId || "default_org",
        property_id: propertyId,
        full_name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        message: form.message.trim(),
        source: "portal_web",
      });
      setDone(true);
      toast.success("¡Mensaje enviado! Un asesor te contactará pronto.");
    } catch {
      toast.error("No pudimos enviar tu mensaje. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-accent" />
        <h3 className="mt-3 text-lg font-semibold text-foreground">
          ¡Gracias por tu interés!
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Hemos recibido tu solicitud para <strong>{propertyTitle}</strong>. Te
          responderemos por WhatsApp o llamada a la brevedad.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="prop-lead-name">Nombre</Label>
        <Input
          id="prop-lead-name"
          placeholder="Tu nombre completo"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prop-lead-phone">Teléfono / WhatsApp</Label>
        <Input
          id="prop-lead-phone"
          type="tel"
          placeholder="Ej. 222 123 4567"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prop-lead-email">Correo (opcional)</Label>
        <Input
          id="prop-lead-email"
          type="email"
          placeholder="tu@correo.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prop-lead-msg">Mensaje</Label>
        <Textarea
          id="prop-lead-msg"
          rows={3}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          disabled={submitting}
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Solicitar información"
        )}
      </Button>
    </form>
  );
}
