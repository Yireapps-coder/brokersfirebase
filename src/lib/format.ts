/** Formatting helpers for the Mexican real-estate UI. */

export function formatPrice(price: number | string, currency = "MXN"): string {
  const value = typeof price === "string" ? Number(price) : price;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("es-MX").format(Number.isFinite(n) ? n : 0);
}

// Property type labels now live in the taxonomy catalog (single source of truth).
export { PROPERTY_TYPE_LABELS } from "@/lib/property-catalog";

export const OPERATION_LABELS: Record<string, string> = {
  venta: "En venta",
  renta: "En renta",
};

export const PROPERTY_STATUS_LABELS: Record<string, string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  vendido: "Vendido",
  rentado: "Rentado",
  inactivo: "Inactivo",
};

export const CONTACT_SOURCE_LABELS: Record<string, string> = {
  portal_web: "Portal web",
  referido: "Referido",
  facebook: "Facebook",
  instagram: "Instagram",
  otro: "Otro",
};

export const CONTACT_STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  interesado: "Interesado",
  visita_agendada: "Visita agendada",
  propuesta: "Propuesta",
  cerrado: "Cerrado",
  descartado: "Descartado",
};

/** Ordered funnel/kanban stages for the leads board. */
export const LEAD_STAGES: { value: string; label: string }[] = [
  { value: "nuevo", label: "Nuevo" },
  { value: "contactado", label: "Contactado" },
  { value: "interesado", label: "Interesado" },
  { value: "visita_agendada", label: "Visita agendada" },
  { value: "propuesta", label: "Propuesta" },
  { value: "cerrado", label: "Cerrado" },
  { value: "descartado", label: "Descartado" },
];

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  llamada: "Llamada",
  whatsapp: "WhatsApp",
  email: "Email",
  visita: "Visita",
  nota: "Nota",
  otra: "Otra",
};

export function formatDateTime(value: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super administrador",
  tenant_admin: "Administrador",
  agent: "Agente",
};
