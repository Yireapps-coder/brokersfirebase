import { queryOptions } from "@tanstack/react-query";
import {
  getPublicOrg,
  getHomeProperties,
  getPublicProperty,
  propertyToCard,
} from "./public.functions";
import { getPublicProperties } from "@/integrations/firebase/services/properties.service";
import type { PropertySearchFilters } from "@/lib/property-filters";

export const publicOrgQuery = () =>
  queryOptions({
    queryKey: ["public-org"],
    queryFn: () => getPublicOrg(),
    staleTime: 1000 * 60 * 10,
  });

export const homePropertiesQuery = (orgId?: string) =>
  queryOptions({
    queryKey: ["home-properties", orgId],
    queryFn: () => getHomeProperties(orgId),
    staleTime: 1000 * 60 * 5,
  });

export const publicPropertyQuery = (identifier: string) =>
  queryOptions({
    queryKey: ["public-property", identifier],
    queryFn: () => getPublicProperty(identifier),
    staleTime: 1000 * 60 * 5,
  });

export const publicPropertiesQuery = (orgId?: string, filters?: PropertySearchFilters) =>
  queryOptions({
    queryKey: ["public-properties", orgId, filters],
    queryFn: async () => {
      const list = await getPublicProperties(orgId);
      let cards = list.map(propertyToCard);

      if (filters) {
        if (filters.q) {
          const q = filters.q.toLowerCase();
          cards = cards.filter(
            (c) =>
              c.title.toLowerCase().includes(q) ||
              (c.city || "").toLowerCase().includes(q) ||
              (c.colonia || "").toLowerCase().includes(q)
          );
        }
        if (filters.operation) {
          cards = cards.filter((c) => c.operation_type === filters.operation);
        }
        if (filters.type) {
          cards = cards.filter((c) => c.property_type === filters.type);
        }
        if (filters.priceMin != null) {
          cards = cards.filter((c) => (c.price || 0) >= filters.priceMin!);
        }
        if (filters.priceMax != null) {
          cards = cards.filter((c) => (c.price || 0) <= filters.priceMax!);
        }
        if (filters.bedrooms) {
          const minBed = Number(filters.bedrooms);
          cards = cards.filter((c) => (c.bedrooms || 0) >= minBed);
        }
      }

      return { items: cards, total: cards.length };
    },
    staleTime: 1000 * 60 * 2,
  });

export const orgColoniasQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["org-colonias", orgId],
    queryFn: async () => {
      const list = await getPublicProperties(orgId);
      const colonias = Array.from(
        new Set(list.map((p) => p.colonia).filter(Boolean) as string[])
      ).sort();
      return colonias;
    },
  });

export const propertyPointsQuery = (orgId?: string) =>
  queryOptions({
    queryKey: ["property-points", orgId],
    queryFn: async () => {
      const list = await getPublicProperties(orgId);
      return list
        .filter((p) => p.public_latitude && p.public_longitude)
        .map((p) => ({
          id: p.id,
          slug: p.slug || p.id,
          title: p.title,
          price: p.price ?? p.sale_price ?? p.rent_price ?? null,
          currency: p.currency || "MXN",
          operation_type: p.operation_type,
          property_type: p.property_type,
          latitude: p.public_latitude!,
          longitude: p.public_longitude!,
          publish_prices: p.publish_prices ?? true,
        }));
    },
  });
