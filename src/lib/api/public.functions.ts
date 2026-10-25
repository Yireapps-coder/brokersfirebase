import {
  getPublicProperties,
  getPropertyBySlug,
  getPropertyById,
} from "@/integrations/firebase/services/properties.service";
import {
  getOrganizationById,
  getOrganizationBySlug,
  getOrganizationByDomain,
  getFirstActiveOrganization,
} from "@/integrations/firebase/services/organizations.service";
import { getProfileById } from "@/integrations/firebase/services/team.service";
import type { Organization, Property } from "@/integrations/firebase/types";
import { coverThumbUrl } from "@/lib/property-images";

export type PublicOrg = Organization;

export type PropertyCardData = {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  currency: string;
  operation_type: string;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spaces: number | null;
  construction_area_m2: number | null;
  land_area_m2: number | null;
  floors_in_building: number | null;
  internal_id: string | null;
  city: string | null;
  state: string | null;
  colonia: string | null;
  cover_image: string | null;
  featured: boolean;
  publish_prices: boolean;
};

export function propertyToCard(p: Property): PropertyCardData {
  return {
    id: p.id,
    slug: p.slug || p.id,
    title: p.title,
    price: p.price ?? p.sale_price ?? p.rent_price ?? null,
    currency: p.currency || "MXN",
    operation_type: p.operation_type,
    property_type: p.property_type,
    bedrooms: p.bedrooms ?? null,
    bathrooms: p.bathrooms ?? null,
    parking_spaces: p.parking_spaces ?? null,
    construction_area_m2: p.construction_area_m2 ?? null,
    land_area_m2: p.land_area_m2 ?? null,
    floors_in_building: p.floors_in_building ?? null,
    internal_id: p.internal_id ?? null,
    city: p.city ?? null,
    state: p.state ?? null,
    colonia: p.colonia ?? null,
    cover_image: coverThumbUrl(p.images),
    featured: Boolean(p.featured),
    publish_prices: p.publish_prices ?? true,
  };
}

export async function getPublicOrg(): Promise<PublicOrg | null> {
  // 1. Detección automática por dominio personalizado en el navegador (ej: alduncinneri.com)
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname.toLowerCase().trim();

    // Si el dominio no es localhost ni el subdominio genérico de Cloudflare/Firebase
    if (
      host &&
      host !== "localhost" &&
      host !== "127.0.0.1" &&
      !host.endsWith(".web.app") &&
      !host.endsWith(".firebaseapp.com") &&
      !host.endsWith(".pages.dev")
    ) {
      const orgByDomain = await getOrganizationByDomain(host);
      if (orgByDomain) return orgByDomain;
    }

    // 2. Si se accede por subdominio (ej: agencia.dominio.com o slug.pages.dev)
    const parts = host.split(".");
    if (parts.length > 2 && parts[0] !== "www") {
      const orgBySlug = await getOrganizationBySlug(parts[0]);
      if (orgBySlug) return orgBySlug;
    }
  }

  // 3. Fallback a la organización predeterminada
  const defaultOrgId = "agencia_principal";
  const org = await getOrganizationById(defaultOrgId);
  if (org) return org;

  const orgBySlug = await getOrganizationBySlug("inmobiliaria");
  if (orgBySlug) return orgBySlug;

  // 4. Fallback final a la primera organización activa disponible
  return await getFirstActiveOrganization();
}

export async function getHomeProperties(orgId?: string) {
  const all = await getPublicProperties(orgId);
  const cards = all.map(propertyToCard);
  return {
    featured: cards.filter((c) => c.featured),
    recent: cards.slice(0, 8),
  };
}

export async function getPublicProperty(identifier: string) {
  return await getPropertyBySlug(identifier);
}

export async function getRelatedProperties(params: {
  orgId: string;
  propertyId: string;
  propertyType?: string;
  city?: string | null;
}) {
  const all = await getPublicProperties(params.orgId);
  return all
    .filter((p) => p.id !== params.propertyId)
    .slice(0, 3)
    .map(propertyToCard);
}

export async function getPublicPropertyContact(property: Property) {
  if (property.agent_id) {
    const agent = await getProfileById(property.agent_id);
    if (agent) {
      return {
        name: agent.full_name,
        phone: agent.phone || null,
        email: agent.email || null,
      };
    }
  }
  const org = await getOrganizationById(property.organization_id);
  return {
    name: org?.name || "Asesor Inmobiliario",
    phone: org?.whatsapp_number || org?.phone || null,
    email: org?.email || null,
  };
}
