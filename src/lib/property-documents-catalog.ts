/**
 * Catalog of the required property documents, grouped by category.
 * The 19 fixed document types drive the per-property checklist and the
 * completion progress indicator. Slugs are stable identifiers stored in
 * `property_documents.document_type` — do not rename without a data migration.
 */

export type DocumentCategory = "inmueble" | "propietario";

export type DocumentStatus = "pendiente" | "subido" | "no_aplica" | "vencido";

export interface DocumentTypeDef {
  /** Stable slug stored in the database. */
  slug: string;
  category: DocumentCategory;
  label: string;
  /** Short helper text shown under the label. */
  hint?: string;
  /**
   * Conditional documents can be marked "No aplica" with a single click,
   * without uploading a file (e.g. régimen de condominio).
   */
  conditional?: boolean;
}

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  inmueble: "Documentos del inmueble",
  propietario: "Documentos del propietario",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  pendiente: "Pendiente",
  subido: "Subido",
  no_aplica: "No aplica",
  vencido: "Vencido",
};

export const PROPERTY_DOCUMENT_TYPES: DocumentTypeDef[] = [
  // A. Documentos del inmueble
  {
    slug: "escritura",
    category: "inmueble",
    label: "Escritura original completa / testimonio notarial",
  },
  {
    slug: "registro_publico",
    category: "inmueble",
    label: "Registro Público de la Propiedad",
  },
  {
    slug: "libre_gravamen",
    category: "inmueble",
    label: "Constancia de libre de gravamen / liberación de crédito",
  },
  {
    slug: "predial",
    category: "inmueble",
    label: "Pago de predial (últimos 5 años) o certificado de no adeudo",
    hint: "Puedes subir varios archivos (un año por archivo).",
  },
  {
    slug: "agua",
    category: "inmueble",
    label: "Pago de agua (últimos 5 años) o certificado de no adeudo",
    hint: "Puedes subir varios archivos.",
  },
  {
    slug: "electricidad",
    category: "inmueble",
    label: "Recibos de electricidad (últimos 6 meses) o constancia de no adeudo",
    hint: "Puedes subir varios archivos.",
  },
  {
    slug: "mantenimiento",
    category: "inmueble",
    label: "Recibos de mantenimiento (5 años) o constancia de no adeudo",
    hint: "Puedes subir varios archivos.",
  },
  { slug: "avaluo", category: "inmueble", label: "Avalúo" },
  { slug: "planos", category: "inmueble", label: "Planos del inmueble" },
  {
    slug: "regimen_condominio",
    category: "inmueble",
    label: "Régimen de condominio",
    hint: "Si el inmueble no está en condominio, marca \"No aplica\".",
    conditional: true,
  },
  {
    slug: "alineamiento",
    category: "inmueble",
    label: "Alineamiento y número oficial",
  },
  {
    slug: "terminacion_obra",
    category: "inmueble",
    label: "Terminación de obra",
    hint: "Si no es construcción nueva o ampliación, marca \"No aplica\".",
    conditional: true,
  },
  // B. Documentos del propietario
  {
    slug: "identificacion",
    category: "propietario",
    label: "Identificación oficial",
  },
  {
    slug: "comprobante_domicilio",
    category: "propietario",
    label: "Comprobante de domicilio (lo más reciente posible)",
  },
  {
    slug: "constancia_fiscal",
    category: "propietario",
    label: "Constancia de Situación Fiscal",
  },
  { slug: "curp", category: "propietario", label: "CURP" },
  {
    slug: "acta_nacimiento",
    category: "propietario",
    label: "Acta de nacimiento (impresión reciente)",
  },
  {
    slug: "acta_matrimonio",
    category: "propietario",
    label: "Acta de matrimonio (impresión reciente)",
    hint: "Si el dueño es soltero o no aplica, marca \"No aplica\".",
    conditional: true,
  },
  {
    slug: "estado_cuenta",
    category: "propietario",
    label: "Estado de cuenta donde se depositarán los recursos",
  },
];

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "inmueble",
  "propietario",
];

/** Total number of required document types (used for progress). */
export const TOTAL_DOCUMENT_TYPES = PROPERTY_DOCUMENT_TYPES.length;

/** Accepted upload formats and size limit. */
export const ACCEPTED_DOCUMENT_MIME = ["application/pdf", "image/jpeg", "image/png"];
export const ACCEPTED_DOCUMENT_EXT = ".pdf,.jpg,.jpeg,.png";
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB
