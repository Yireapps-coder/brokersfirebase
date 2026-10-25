/**
 * Property type taxonomy — mirrors EasyBroker's real data model.
 *
 * Two levels:
 *  - `category`  — coarse classification used for filtering/reporting.
 *  - `property_type` — the concrete catalog entry shown to users, grouped by
 *    use case (Residencial / Comercial / Industrial).
 *
 * This file is the single source of truth. The DB enums
 * (`property_category`, `property_type`) must stay in sync with it.
 */

export type PropertyCategory = "residential" | "unit" | "building" | "land" | "commercial" | "general";
export type PropertyType = "apartment" | "house" | "house_in_condo" | "commercial_space" | "office" | "residential_land" | "commercial_land" | "industrial_land" | "warehouse" | "building" | "other";

export type PropertyTypeOption = {
  value: PropertyType;
  label: string;
  category: PropertyCategory;
};

export type PropertyTypeGroup = {
  label: string;
  options: PropertyTypeOption[];
};

export const PROPERTY_CATEGORY_LABELS: Record<PropertyCategory, string> = {
  residential: "Residencial",
  unit: "Unidad",
  building: "Edificación",
  land: "Terreno",
  commercial: "Comercial",
  general: "General",
};

/** Catalog grouped by use case — the order drives the select UI. */
export const PROPERTY_TYPE_GROUPS: PropertyTypeGroup[] = [
  {
    label: "Residencial",
    options: [
      { value: "casa", label: "Casa", category: "residential" },
      { value: "casa_condominio", label: "Casa en condominio", category: "residential" },
      { value: "departamento", label: "Departamento", category: "unit" },
      { value: "quinta", label: "Quinta", category: "residential" },
      { value: "rancho", label: "Rancho", category: "residential" },
      { value: "terreno", label: "Terreno", category: "land" },
      { value: "villa", label: "Villa", category: "residential" },
    ],
  },
  {
    label: "Comercial",
    options: [
      { value: "bodega_comercial", label: "Bodega comercial", category: "building" },
      { value: "casa_uso_suelo", label: "Casa con uso de suelo", category: "general" },
      { value: "edificio", label: "Edificio", category: "building" },
      { value: "huerta", label: "Huerta", category: "general" },
      { value: "local_comercial", label: "Local comercial", category: "commercial" },
      { value: "local_centro_comercial", label: "Local en centro comercial", category: "commercial" },
      { value: "oficina", label: "Oficina", category: "commercial" },
      { value: "terreno_comercial", label: "Terreno comercial", category: "land" },
    ],
  },
  {
    label: "Industrial",
    options: [
      { value: "bodega_industrial", label: "Bodega industrial", category: "building" },
      { value: "nave_industrial", label: "Nave industrial", category: "building" },
      { value: "terreno_industrial", label: "Terreno industrial", category: "land" },
    ],
  },
];

/** Flat list of every catalog option. */
export const PROPERTY_TYPE_OPTIONS: PropertyTypeOption[] = PROPERTY_TYPE_GROUPS.flatMap(
  (g) => g.options,
);

const OPTION_BY_VALUE = new Map<PropertyType, PropertyTypeOption>(
  PROPERTY_TYPE_OPTIONS.map((o) => [o.value, o]),
);

export function getPropertyTypeOption(value: PropertyType): PropertyTypeOption | undefined {
  return OPTION_BY_VALUE.get(value);
}

export function propertyTypeLabel(value: PropertyType): string {
  return OPTION_BY_VALUE.get(value)?.label ?? value;
}

/** Category that a given property_type belongs to. */
export function categoryForPropertyType(value: PropertyType): PropertyCategory {
  return OPTION_BY_VALUE.get(value)?.category ?? "general";
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = Object.fromEntries(
  PROPERTY_TYPE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<PropertyType, string>;

/* ------------------------------------------------------------------ */
/* Operations                                                          */
/* ------------------------------------------------------------------ */

export type SaleCommissionType = Enums<"sale_commission_type">;
export type RentalCommissionType = Enums<"rental_commission_type">;

export const SALE_COMMISSION_TYPE_LABELS: Record<SaleCommissionType, string> = {
  unspecified: "Sin especificar",
  percentage: "Porcentaje (%)",
  amount: "Monto fijo",
};

export const RENTAL_COMMISSION_TYPE_LABELS: Record<RentalCommissionType, string> = {
  unspecified: "Sin especificar",
  months: "Meses de renta",
  percentage: "Porcentaje (%)",
  amount: "Monto fijo",
};

export const OPERATION_CURRENCIES = ["MXN", "USD", "EUR"] as const;
export type OperationCurrency = (typeof OPERATION_CURRENCIES)[number];

/** Financing options offered for residential sales (EasyBroker catalog). */
export type FinancingOption = { id: string; label: string };

export const FINANCING_OPTIONS: FinancingOption[] = [
  { id: "bank_credit", label: "Crédito bancario" },
  { id: "infonavit", label: "INFONAVIT" },
  { id: "fovissste", label: "FOVISSSTE" },
  { id: "cofinavit", label: "Cofinavit" },
  { id: "mortgage", label: "Crédito hipotecario" },
  { id: "cash", label: "Contado" },
];

const FINANCING_BY_ID = new Map(FINANCING_OPTIONS.map((o) => [o.id, o]));

export function financingOptionLabel(id: string): string {
  return FINANCING_BY_ID.get(id)?.label ?? id;
}

/* ------------------------------------------------------------------ */
/* Amenities catalog — mirrors the public.amenities lookup table.      */
/* ------------------------------------------------------------------ */

export type Amenity = { id: string; label: string };
export type AmenityGroup = { category: string; label: string; options: Amenity[] };

/**
 * Fixed amenities catalog grouped by section. The order drives the form UI.
 * Keep in sync with the `public.amenities` seed migration.
 */
export const AMENITY_GROUPS: AmenityGroup[] = [
  {
    category: "visitor_parking",
    label: "Estacionamiento de visitas",
    options: [
      { id: "estacionamiento_visitas", label: "Estacionamiento de visitas" },
    ],
  },
  {
    category: "exterior",
    label: "Exterior",
    options: [
      { id: "acceso_playa", label: "Acceso a la playa" },
      { id: "anden", label: "Andén" },
      { id: "balcon", label: "Balcón" },
      { id: "cisterna", label: "Cisterna" },
      { id: "estacionamiento_techado", label: "Estacionamiento techado" },
      { id: "facilidad_estacionarse", label: "Facilidad para estacionarse" },
      { id: "frente_playa", label: "Frente a la playa" },
      { id: "frente_agua", label: "Frente al agua" },
      { id: "garaje", label: "Garaje" },
      { id: "jardin", label: "Jardín" },
      { id: "muelle_carga", label: "Muelle de carga" },
      { id: "parrilla", label: "Parrilla" },
      { id: "patio", label: "Patio" },
      { id: "riego_aspersion", label: "Riego por aspersión" },
      { id: "roof_garden", label: "Roof garden" },
      { id: "terraza", label: "Terraza" },
      { id: "vista_agua", label: "Vista al agua" },
      { id: "vista_mar", label: "Vista al mar" },
    ],
  },
  {
    category: "general",
    label: "General",
    options: [
      { id: "accesible_adultos_mayores", label: "Accesible para adultos mayores" },
      { id: "accesible_discapacidad", label: "Accesible para discapacitados" },
      { id: "aire_acondicionado", label: "Aire acondicionado" },
      { id: "alarma", label: "Alarma" },
      { id: "amueblado", label: "Amueblado" },
      { id: "bodega", label: "Bodega" },
      { id: "calefaccion", label: "Calefacción" },
      { id: "chimenea", label: "Chimenea" },
      { id: "circuito_cerrado", label: "Circuito cerrado de TV" },
      { id: "closet", label: "Clóset" },
      { id: "cocina", label: "Cocina" },
      { id: "cocina_equipada", label: "Cocina equipada" },
      { id: "cocina_integral", label: "Cocina integral" },
      { id: "conexion_lavadora", label: "Conexión para lavadora" },
      { id: "conmutador", label: "Conmutador" },
      { id: "cuarto_servicio", label: "Cuarto de servicio" },
      { id: "dormitorio_principal", label: "Dormitorio principal" },
      { id: "dos_plantas", label: "Dos plantas" },
      { id: "elevador", label: "Elevador" },
      { id: "estudio", label: "Estudio" },
      { id: "fraccionamiento_privado", label: "Fraccionamiento privado" },
      { id: "hidroneumatico", label: "Hidroneumático" },
      { id: "oficina", label: "Oficina" },
      { id: "panel_solar", label: "Panel solar" },
      { id: "penthouse", label: "Penthouse" },
      { id: "planta_baja", label: "Planta baja" },
      { id: "planta_electrica", label: "Planta eléctrica" },
      { id: "portero", label: "Portero" },
      { id: "rampas", label: "Rampas" },
      { id: "recamara_planta_baja", label: "Recámara en planta baja" },
      { id: "seguridad_12h", label: "Seguridad 12 horas" },
      { id: "seguridad_24h", label: "Seguridad 24 horas" },
      { id: "una_sola_planta", label: "Una sola planta" },
      { id: "vestidor", label: "Vestidor" },
    ],
  },
  {
    category: "recreation",
    label: "Recreación",
    options: [
      { id: "alberca", label: "Alberca" },
      { id: "area_juegos_infantiles", label: "Área de juegos infantiles" },
      { id: "cancha_padel", label: "Cancha de pádel" },
      { id: "cancha_tenis", label: "Cancha de tenis" },
      { id: "cine", label: "Cine" },
      { id: "fogatero", label: "Fogatero" },
      { id: "gimnasio", label: "Gimnasio" },
      { id: "jacuzzi", label: "Jacuzzi" },
      { id: "ludoteca", label: "Ludoteca" },
      { id: "salon_usos_multiples", label: "Salón de usos múltiples" },
      { id: "sauna", label: "Sauna" },
    ],
  },
  {
    category: "policy",
    label: "Políticas",
    options: [
      { id: "mascotas_permitidas", label: "Mascotas permitidas" },
      { id: "mascotas_no_permitidas", label: "Mascotas no permitidas" },
      { id: "permitido_fumar", label: "Permitido fumar" },
      { id: "prohibido_fumar", label: "Prohibido fumar" },
    ],
  },
];

export const AMENITY_OPTIONS: Amenity[] = AMENITY_GROUPS.flatMap((g) => g.options);

const AMENITY_BY_ID = new Map(AMENITY_OPTIONS.map((a) => [a.id, a]));

export function amenityLabel(id: string): string {
  return AMENITY_BY_ID.get(id)?.label ?? id;
}

/* ------------------------------------------------------------------ */
/* Characteristics catalogs                                            */
/* ------------------------------------------------------------------ */

export const CONSERVATION_STATE_OPTIONS = [
  "A estrenar",
  "Excelente",
  "Bueno",
  "Para remodelar",
  "En construcción",
] as const;

export const DISPOSITION_OPTIONS = [
  "Frente",
  "Contrafrente",
  "Interno",
  "Lateral",
] as const;

export const ORIENTATION_OPTIONS = [
  "Norte",
  "Sur",
  "Este",
  "Oeste",
  "Noreste",
  "Noroeste",
  "Sureste",
  "Suroeste",
] as const;

/* ------------------------------------------------------------------ */
/* Conditional field visibility                                        */
/* ------------------------------------------------------------------ */

/**
 * Fields whose visibility depends on the property category.
 * `true` means the field is shown for that category.
 *
 * Rules (mirrors EasyBroker):
 *  - bedrooms/bathrooms/half_bathrooms/parking_spaces/construction_area_m2:
 *      hidden for `land`.
 *  - lot_size_m2/lot_width_m/lot_length_m: hidden for `unit`.
 *  - floors_in_building: hidden for `unit`, `commercial`, `land`.
 *  - conservation_state/disposition/orientation: hidden for `building`,
 *      `commercial`, `land`.
 *  - financing_option_ids: shown only for `residential`.
 */
export type PropertyField =
  | "bedrooms"
  | "bathrooms"
  | "half_bathrooms"
  | "parking_spaces"
  | "construction_area_m2"
  | "uncovered_area_m2"
  | "lot_size_m2"
  | "lot_width_m"
  | "lot_length_m"
  | "floors_in_building"
  | "unit_floor"
  | "year_built"
  | "maintenance_fee_monthly"
  | "conservation_state"
  | "disposition"
  | "orientation"
  | "financing_option_ids";

const HIDE_FOR_CATEGORY: Record<PropertyField, PropertyCategory[]> = {
  bedrooms: ["building", "commercial", "land"],
  bathrooms: ["building", "commercial", "land"],
  half_bathrooms: ["building", "commercial", "land"],
  parking_spaces: ["land"],
  construction_area_m2: ["land"],
  uncovered_area_m2: ["unit"],
  lot_size_m2: ["unit"],
  lot_width_m: ["unit"],
  lot_length_m: ["unit"],
  floors_in_building: ["unit", "commercial", "land"],
  // floor a unit/office sits on → only for units and commercial
  unit_floor: ["residential", "building", "land", "general"],
  year_built: ["land"],
  // monthly HOA/maintenance fee → not applicable to raw land
  maintenance_fee_monthly: ["land"],
  conservation_state: ["building", "commercial", "land"],
  disposition: ["building", "commercial", "land"],
  orientation: ["building", "commercial", "land"],
  // shown ONLY for residential → hidden everywhere else
  financing_option_ids: ["unit", "building", "land", "commercial", "general"],
};

export function isFieldVisible(
  field: PropertyField,
  category: PropertyCategory,
): boolean {
  return !HIDE_FOR_CATEGORY[field].includes(category);
}

