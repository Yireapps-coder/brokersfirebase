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

  // 3. Fallback a la organización principal (Alduncin & Neri)
  const defaultOrgId = "22222222-2222-2222-2222-222222222222";
  const org = await getOrganizationById(defaultOrgId);
  if (org) return org;

  const orgBySlug = await getOrganizationBySlug("alduncinneri");
  if (orgBySlug) return orgBySlug;

  // 4. Fallback final a la primera organización activa disponible
  return await getFirstActiveOrganization();
}

export type PublicPropertyContact = {
  orgName: string;
  agentName: string | null;
  agentPhone: string | null;
  agentWhatsapp: string | null;
};

export async function getHomeProperties(orgId?: string) {
  const all = await getPublicProperties(orgId);
  const cards = all.map(propertyToCard);
  const recent = cards.slice(0, 8);
  const featuredRows = cards.filter((c) => c.featured).slice(0, 6);
  const featured = featuredRows.length >= 3 ? featuredRows : recent.slice(0, 6);
  return {
    featured,
    recent,
  };
}

export async function getPublicProperty(
  input: string | { data: { identifier: string } }
) {
  const identifier = typeof input === "string" ? input : input.data.identifier;
  return await getPropertyBySlug(identifier);
}

export async function getRelatedProperties(
  input:
    | {
        orgId: string;
        propertyId: string;
        propertyType?: string;
        city?: string | null;
      }
    | {
        data: {
          organizationId: string;
          propertyId: string;
          propertyType?: string;
          city?: string | null;
        };
      }
) {
  const orgId = "data" in input ? input.data.organizationId : input.orgId;
  const propertyId = "data" in input ? input.data.propertyId : input.propertyId;
  const all = await getPublicProperties(orgId);
  return all
    .filter((p) => p.id !== propertyId)
    .slice(0, 4)
    .map(propertyToCard);
}

export async function getPublicPropertyContact(
  input: Property | { data: { propertyId: string } }
): Promise<PublicPropertyContact | null> {
  try {
    const property =
      "data" in input ? await getPropertyById(input.data.propertyId) : input;
    if (!property) return null;

    const org = await getOrganizationById(property.organization_id).catch(
      () => null
    );
    let agentName: string | null = null;
    let agentPhone: string | null = null;

    if (property.agent_id) {
      const agent = await getProfileById(property.agent_id).catch(() => null);
      if (agent) {
        agentName = agent.full_name || null;
        agentPhone = agent.phone || null;
      }
    }

    return {
      orgName: org?.name || "Agencia Inmobiliaria",
      agentName,
      agentPhone: agentPhone || org?.phone || null,
      agentWhatsapp: org?.whatsapp_number || agentPhone || null,
    };
  } catch {
    return null;
  }
}
