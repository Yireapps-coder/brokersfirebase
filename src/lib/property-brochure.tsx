import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";

import type { Style } from "@react-pdf/types";

import { formatNumber, formatPrice, OPERATION_LABELS } from "@/lib/format";
import {
  amenityLabel,
  propertyTypeLabel,
  type PropertyType,
} from "@/lib/property-catalog";
import { galleryFullUrls } from "@/lib/property-images";
import {
  resolveBrochurePalette,
  type BrochurePalette,
} from "@/lib/brochure-theme";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** Minimal tenant info the brochure needs (theme is the styling source). */
export type BrochureOrg = {
  name: string;
  logo_url: string | null;
  theme: unknown;
  whatsapp_number?: string | null;
};

/** Contact footer — present only in the "with contact" variant. */
export type BrochureContact = {
  orgName: string;
  agentName?: string | null;
  agentPhone?: string | null;
  agentWhatsapp?: string | null;
};

type Fact = { label: string; value: string };

/** Fully pre-resolved, render-ready data — the Document stays pure. */
type BrochureData = {
  palette: BrochurePalette;
  logoDataUrl: string | null;
  orgName: string;
  title: string;
  code: string | null;
  location: string | null;
  operationLabel: string | null;
  typeLabel: string | null;
  price: string | null;
  priceCaption: string;
  description: string | null;
  generalFacts: Fact[];
  physicalFacts: Fact[];
  legalStatus: string | null;
  amenities: string[];
  mainImageDataUrl: string | null;
  thumbDataUrls: string[];
  contact: BrochureContact | null;
};

/* ------------------------------------------------------------------ */
/* Image helpers (fetch + inline so react-pdf never hits the network)  */
/* ------------------------------------------------------------------ */

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Fetches an image and re-encodes it as a centered "cover" JPEG data URL of
 * the requested pixel size. Re-encoding through canvas guarantees a clean,
 * react-pdf-friendly JPEG (some source images embed as blank otherwise) and
 * keeps the file light. Falls back to the original data URL if canvas is
 * unavailable.
 */
async function toCoverJpeg(
  url: string,
  width: number,
  height: number,
): Promise<string | null> {
  const dataUrl = await toDataUrl(url);
  if (!dataUrl) return null;
  try {
    return await new Promise<string | null>((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        // Center "cover" crop: scale to fill, crop the overflow.
        const scale = Math.max(
          width / img.naturalWidth,
          height / img.naturalHeight,
        );
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  } catch {
    return dataUrl;
  }
}

/** 400x400 square thumbnail (used for the secondary gallery row). */
function toThumbDataUrl(url: string, size = 400): Promise<string | null> {
  return toCoverJpeg(url, size, size);
}

/**
 * Strips emoji / pictographs / variation selectors that the PDF's Helvetica
 * and serif fonts cannot render (they otherwise show up as garbage like
 * "<B?" or "=3Ï"). Plain Latin text, accents and punctuation are preserved.
 */
function sanitizeText(input: string): string {
  return input
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E000}-\u{F8FF}]/gu,
      "",
    )
    .replace(/[\u200B\u200C\uFEFF]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ------------------------------------------------------------------ */
/* Data builder                                                        */
/* ------------------------------------------------------------------ */

type RawProperty = Record<string, unknown>;

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = sanitizeText(v);
  return t ? t : null;
}

/** Property code shown in the header and used for the filename. */
export function propertyCode(p: RawProperty): string {
  return (
    str(p.internal_id) ?? str(p.folio) ?? String(p.id ?? "").slice(0, 8)
  );
}

async function buildBrochureData(
  p: RawProperty,
  opts: {
    org: BrochureOrg;
    contact: BrochureContact | null;
    isPublic: boolean;
  },
): Promise<BrochureData> {
  const palette = resolveBrochurePalette(opts.org.theme);

  // Photos (up to 6): the first stays full-res for the hero, the rest are
  // re-encoded as 400x400 square thumbnails. Failures are skipped silently.
  const urls = galleryFullUrls(p.images).slice(0, 6);
  const [mainUrl, ...thumbUrls] = urls;
  const [mainImageDataUrl, fetchedThumbs] = await Promise.all([
    mainUrl ? toCoverJpeg(mainUrl, 1100, 470) : Promise.resolve(null),
    Promise.all(thumbUrls.map((u) => toThumbDataUrl(u, 400))),
  ]);
  const thumbDataUrls = fetchedThumbs.filter((u): u is string => !!u);

  // The "ficha sin contacto" variant (contact === null) intentionally omits
  // the agency logo so the seller can forward it without revealing the broker.
  const logoDataUrl =
    opts.contact && opts.org.logo_url
      ? await toDataUrl(opts.org.logo_url)
      : null;

  // --- General facts ---
  const generalFacts: Fact[] = [];
  const location =
    [str(p.colonia), str(p.city), str(p.state)].filter(Boolean).join(", ") ||
    null;
  if (location) generalFacts.push({ label: "Ubicación", value: location });
  const operationLabel = OPERATION_LABELS[String(p.operation_type)] ?? null;
  if (operationLabel)
    generalFacts.push({ label: "Operación", value: operationLabel });
  const typeLabel = p.property_type
    ? propertyTypeLabel(p.property_type as PropertyType)
    : null;
  if (typeLabel) generalFacts.push({ label: "Tipo de inmueble", value: typeLabel });

  // --- Price (respect publish_prices on the public variant) ---
  const priceValue = num(p.price);
  const showPrice = !(opts.isPublic && p.publish_prices === false);
  const price =
    showPrice && priceValue != null
      ? formatPrice(priceValue, String(p.currency ?? "MXN"))
      : null;
  const priceCaption =
    operationLabel === "En renta" ? "Precio de renta" : "Precio de venta";

  // --- Physical characteristics ---
  const physicalFacts: Fact[] = [];
  const push = (label: string, value: string | null) => {
    if (value) physicalFacts.push({ label, value });
  };
  const land = num(p.land_area_m2);
  const built = num(p.construction_area_m2);
  push("Terreno", land != null ? `${formatNumber(land)} m²` : null);
  push("Construcción", built != null ? `${formatNumber(built)} m²` : null);
  const beds = num(p.bedrooms);
  push("Recámaras", beds != null ? formatNumber(beds) : null);
  const baths = num(p.bathrooms);
  push("Baños", baths != null ? formatNumber(baths) : null);
  const halfBaths = num(p.half_bathrooms);
  push("Medios baños", halfBaths ? formatNumber(halfBaths) : null);
  const parking = num(p.parking_spaces);
  push("Estacionamientos", parking != null ? formatNumber(parking) : null);
  const floors = num(p.floors_in_building);
  push("Niveles", floors != null ? formatNumber(floors) : null);
  const year = num(p.year_built);
  push("Año de construcción", year != null ? String(year) : null);
  push("Estado de conservación", str(p.conservation_state));
  push("Disposición", str(p.disposition));
  push("Orientación", str(p.orientation));
  const maintenance = num(p.maintenance_fee_monthly);
  push(
    "Mantenimiento mensual",
    maintenance != null
      ? formatPrice(maintenance, String(p.currency ?? "MXN"))
      : null,
  );

  // --- Legal status (only the general status, never documents) ---
  const legalStatus = p.is_foreclosure === true ? "Propiedad en remate" : null;

  // --- Amenities ---
  const amenityIds = Array.isArray(p.amenity_ids)
    ? (p.amenity_ids as string[])
    : Array.isArray(p.amenities)
      ? (p.amenities as string[])
      : [];
  const amenities = amenityIds
    .filter(Boolean)
    .map((id) => amenityLabel(id))
    .slice(0, 30);

  // --- Description (covers distribution / finishes when available) ---
  let description = str(p.description);
  if (description && description.length > 700) {
    description = `${description.slice(0, 697).trimEnd()}…`;
  }

  return {
    palette,
    logoDataUrl,
    orgName: opts.org.name,
    title: str(p.title) ?? "Propiedad",
    code: propertyCode(p),
    location,
    operationLabel,
    typeLabel,
    price,
    priceCaption,
    description,
    generalFacts,
    physicalFacts,
    legalStatus,
    amenities,
    mainImageDataUrl,
    thumbDataUrls,
    contact: opts.contact,
  };
}

/* ------------------------------------------------------------------ */
/* PDF Document                                                        */
/* ------------------------------------------------------------------ */

function styles(p: BrochurePalette) {
  return StyleSheet.create({
    page: {
      backgroundColor: "#FFFFFF",
      paddingTop: 32,
      paddingBottom: 84,
      paddingHorizontal: 36,
      fontFamily: p.body,
      fontSize: 9.5,
      color: "#2B2B2B",
      display: "flex",
      flexDirection: "column",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 2,
      borderBottomColor: p.primary,
      paddingBottom: 10,
    },
    headerBrand: { flexDirection: "row", alignItems: "center", gap: 8 },
    logo: { height: 38, maxWidth: 140, objectFit: "contain" },
    brandName: {
      fontFamily: p.heading,
      fontSize: 16,
      fontWeight: 700,
      color: p.primary,
    },
    codeBadge: {
      backgroundColor: p.surface,
      color: p.primary,
      fontSize: 8,
      fontWeight: 700,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
    },
    title: {
      fontFamily: p.heading,
      fontSize: 21,
      fontWeight: 700,
      color: p.primary,
      marginTop: 14,
    },
    subtitle: { color: p.textSecondary, fontSize: 10, marginTop: 3 },
    galleryMain: {
      width: "100%",
      height: 158,
      marginTop: 10,
      borderRadius: 6,
      objectFit: "cover",
    },
    thumbRow: { flexDirection: "row", gap: 6, marginTop: 6 },
    thumb: { flex: 1, height: 72, borderRadius: 4, objectFit: "cover" },
    priceBanner: {
      marginTop: 10,
      backgroundColor: p.accent,
      borderRadius: 6,
      paddingVertical: 10,
      paddingHorizontal: 14,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    priceCaption: {
      color: "#FFFFFF",
      fontSize: 9,
      opacity: 0.9,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    priceValue: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: 700,
      fontFamily: p.heading,
    },
    columns: { flexDirection: "row", gap: 16, marginTop: 12 },
    column: { flex: 1 },
    sectionTitle: {
      fontFamily: p.heading,
      fontSize: 12,
      fontWeight: 700,
      color: p.primary,
      marginBottom: 6,
      paddingBottom: 3,
      borderBottomWidth: 1,
      borderBottomColor: p.surface,
    },
    factRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    factLabel: { color: p.textSecondary, fontSize: 9 },
    factValue: { fontSize: 9, fontWeight: 700, color: "#2B2B2B", textAlign: "right" },
    description: {
      marginTop: 10,
      fontSize: 9,
      lineHeight: 1.5,
      color: "#3A3A3A",
    },
    legalRow: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 6 },
    legalBadge: {
      backgroundColor: p.surface,
      color: p.primary,
      fontSize: 9,
      fontWeight: 700,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
    },
    amenitiesWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
      marginTop: 6,
    },
    amenityChip: {
      fontSize: 8.5,
      color: "#2B2B2B",
      backgroundColor: p.surface,
      borderRadius: 10,
      paddingVertical: 3,
      paddingHorizontal: 8,
    },
    footer: {
      position: "absolute",
      left: 36,
      right: 36,
      bottom: 28,
      backgroundColor: p.primary,
      borderRadius: 6,
      padding: 14,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerCol: { flexDirection: "column" },
    footerOrg: {
      color: "#FFFFFF",
      fontFamily: p.heading,
      fontWeight: 700,
      fontSize: 12,
    },
    footerLabel: { color: "#FFFFFF", opacity: 0.85, fontSize: 8, marginTop: 4 },
    footerAgent: { color: "#FFFFFF", fontSize: 11, fontWeight: 700 },
    footerContact: { color: "#FFFFFF", fontSize: 9.5, marginTop: 2 },
  });
}

/**
 * Renders text but forces the ampersand "&" to the built-in Helvetica font.
 * The serif heading font (Playfair Display) draws "&" as a calligraphic Et
 * ligature that users don't recognize as an ampersand, so any "&" in the
 * agency name or property title would look broken.
 */
function AmpText({
  style,
  children,
}: {
  style?: Style | Style[];
  children: string;
}) {
  const parts = children.split(/(&)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part === "&" ? (
          <Text key={i} style={{ fontFamily: "Helvetica" }}>
            &
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

function BrochureDocument({ data }: { data: BrochureData }) {
  const s = styles(data.palette);
  const mainImg = data.mainImageDataUrl;
  const thumbs = data.thumbDataUrls.slice(0, 5);

  return (
    <Document
      title={`Ficha técnica — ${data.title}`}
      author={data.orgName}
    >
      <Page size="LETTER" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          {data.contact ? (
            <View style={s.headerBrand}>
              {data.logoDataUrl && (
                <Image src={data.logoDataUrl} style={s.logo} />
              )}
              <AmpText style={s.brandName}>{data.orgName}</AmpText>
            </View>
          ) : (
            <Text />
          )}
          {data.code ? (
            <Text style={s.codeBadge}>IDP {data.code}</Text>
          ) : (
            <Text />
          )}
        </View>

        {/* Title + location */}
        <AmpText style={s.title}>{data.title}</AmpText>
        {(data.operationLabel || data.typeLabel || data.location) && (
          <Text style={s.subtitle}>
            {[
              [data.operationLabel, data.typeLabel].filter(Boolean).join(" · "),
              data.location,
            ]
              .filter(Boolean)
              .join("  —  ")}
          </Text>
        )}

        {/* Gallery */}
        {mainImg && <Image src={mainImg} style={s.galleryMain} />}
        {thumbs.length > 0 && (
          <View style={s.thumbRow}>
            {thumbs.map((src: string, i: number) => (
              <Image key={i} src={src} style={s.thumb} />
            ))}
          </View>
        )}

        {/* Price */}
        {data.price && (
          <View style={s.priceBanner}>
            <Text style={s.priceCaption}>{data.priceCaption}</Text>
            <Text style={s.priceValue}>{data.price}</Text>
          </View>
        )}

        {/* Data columns */}
        <View style={s.columns}>
          {data.generalFacts.length > 0 && (
            <View style={s.column}>
              <Text style={s.sectionTitle}>Datos generales</Text>
              {data.generalFacts.map((f, i) => (
                <View key={i} style={s.factRow}>
                  <Text style={s.factLabel}>{f.label}</Text>
                  <Text style={s.factValue}>{f.value}</Text>
                </View>
              ))}
            </View>
          )}
          {data.physicalFacts.length > 0 && (
            <View style={s.column}>
              <Text style={s.sectionTitle}>Características físicas</Text>
              {data.physicalFacts.map((f, i) => (
                <View key={i} style={s.factRow}>
                  <Text style={s.factLabel}>{f.label}</Text>
                  <Text style={s.factValue}>{f.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Legal status */}
        {data.legalStatus && (
          <View style={s.legalRow}>
            <Text style={s.factLabel}>Situación legal:</Text>
            <Text style={s.legalBadge}>{data.legalStatus}</Text>
          </View>
        )}

        {/* Description */}
        {data.description && (
          <Text style={s.description}>{data.description}</Text>
        )}

        {/* Amenities */}
        {data.amenities.length > 0 && (
          <View style={{ marginTop: 10 }} wrap={false}>
            <Text style={s.sectionTitle}>Amenidades</Text>
            <View style={s.amenitiesWrap}>
              {data.amenities.map((a, i) => (
                <Text key={i} style={s.amenityChip}>
                  {a}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Contact footer — only on the "with contact" variant */}
        {data.contact && (
          <View style={s.footer} fixed>
            <View style={s.footerCol}>
              <AmpText style={s.footerOrg}>{data.contact.orgName}</AmpText>
              {data.contact.agentName && (
                <>
                  <Text style={s.footerLabel}>Agente asignado</Text>
                  <Text style={s.footerAgent}>{data.contact.agentName}</Text>
                </>
              )}
            </View>
            <View style={[s.footerCol, { alignItems: "flex-end" }]}>
              {data.contact.agentPhone && (
                <Text style={s.footerContact}>Tel. {data.contact.agentPhone}</Text>
              )}
              {data.contact.agentWhatsapp && (
                <Text style={s.footerContact}>
                  WhatsApp {data.contact.agentWhatsapp}
                </Text>
              )}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has time to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generates and downloads the property brochure entirely in the browser.
 * `contact` is omitted to produce the "sin contacto" variant.
 */
export async function downloadPropertyBrochure(opts: {
  property: RawProperty;
  org: BrochureOrg;
  contact: BrochureContact | null;
  isPublic: boolean;
}): Promise<void> {
  const data = await buildBrochureData(opts.property, {
    org: opts.org,
    contact: opts.contact,
    isPublic: opts.isPublic,
  });

  const blob = await pdf(<BrochureDocument data={data} />).toBlob();

  const code = data.code ?? "propiedad";
  const filename = opts.contact
    ? `ficha-${code}.pdf`
    : `ficha-${code}-sin-contacto.pdf`;
  triggerDownload(blob, filename);
}
