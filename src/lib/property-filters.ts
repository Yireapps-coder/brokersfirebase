/** Shared catalog + helpers for the public property search/listing filters. */

export type LandSizeRange = {
  value: string;
  label: string;
  min?: number;
  max?: number;
};

/** Predefined land-size (terreno) ranges shown in the filter dropdown. */
export const LAND_SIZE_RANGES: LandSizeRange[] = [
  { value: "0-60", label: "Hasta 60 m²", max: 60 },
  { value: "60-100", label: "De 60 a 100 m²", min: 60, max: 100 },
  { value: "100-150", label: "De 100 a 150 m²", min: 100, max: 150 },
  { value: "150-200", label: "De 150 a 200 m²", min: 150, max: 200 },
  { value: "200-250", label: "De 200 a 250 m²", min: 200, max: 250 },
  { value: "250-300", label: "De 250 a 300 m²", min: 250, max: 300 },
  { value: "300-400", label: "De 300 a 400 m²", min: 300, max: 400 },
  { value: "400-500", label: "De 400 a 500 m²", min: 400, max: 500 },
  { value: "500+", label: "Más de 500 m²", min: 500 },
];

const LAND_BY_VALUE = new Map(LAND_SIZE_RANGES.map((r) => [r.value, r]));

export function landRange(value: string | undefined): LandSizeRange | undefined {
  return value ? LAND_BY_VALUE.get(value) : undefined;
}

/** Recámaras options — "5" means 5 or more. */
export const BEDROOM_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5+" },
];

export type SortOption = "recent" | "price_asc" | "price_desc";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Más reciente" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
];

/** URL/search-param shape for the listing filters. */
export type PropertySearchFilters = {
  q?: string;
  operation?: "venta" | "renta";
  type?: string;
  city?: string;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: string;
  land?: string;
  colonia?: string;
  sort?: SortOption;
};

/** Count of active filters (drives the mobile "Filtros" badge). */
export function activeFilterCount(s: PropertySearchFilters): number {
  let n = 0;
  if (s.q) n++;
  if (s.operation) n++;
  if (s.type) n++;
  if (s.city) n++;
  if (s.priceMin != null) n++;
  if (s.priceMax != null) n++;
  if (s.bedrooms) n++;
  if (s.land) n++;
  if (s.colonia) n++;
  return n;
}
