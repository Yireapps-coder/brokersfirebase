// Tipos de dominio para BrokersFirebase (Cloud Firestore)

export type AppRole = "super_admin" | "tenant_admin" | "agent";
export type PropertyStatus = "disponible" | "apartada" | "vendida" | "rentada" | "baja";
export type OperationType = "venta" | "renta" | "ambas";
export type PropertyType =
  | "casa"
  | "departamento"
  | "terreno"
  | "local"
  | "oficina"
  | "bodega"
  | "rancho"
  | "otro";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "trial";
  logo_url?: string | null;
  whatsapp_number?: string | null;
  phone?: string | null;
  address?: string | null;
  primary_color?: string | null;
  theme?: Record<string, string> | null;
  hero_image_url?: string | null;
  hero_overlay_opacity?: number;
  hero_overlay_color?: string;
  facebook_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  tiktok_url?: string | null;
  privacy_url?: string | null;
  terms_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Profile {
  id: string; // Firebase Auth UID
  email: string;
  full_name: string;
  phone?: string | null;
  organization_id: string;
  role: AppRole;
  status: "active" | "inactive";
  avatar_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface PropertyImageItem {
  id: string;
  name: string;
  url: string;
  thumbUrl?: string;
  size?: number;
  width?: number;
  height?: number;
  order: number;
  isCover: boolean;
  alt?: string;
}

export interface Property {
  id: string;
  organization_id: string;
  agent_id?: string | null;
  owner_id?: string | null;
  internal_id?: string | null;
  folio?: string | null;
  slug: string;
  title: string;
  description?: string | null;
  property_type: PropertyType;
  operation_type: OperationType;
  status: PropertyStatus;
  
  // Precios
  price?: number | null;
  sale_price?: number | null;
  rent_price?: number | null;
  currency: string; // "MXN" | "USD"
  sale_currency?: string;
  rent_currency?: string;
  publish_prices: boolean;
  maintenance_fee_monthly?: number | null;

  // Características
  bedrooms?: number | null;
  bathrooms?: number | null;
  half_bathrooms?: number | null;
  parking_spaces?: number | null;
  construction_area_m2?: number | null;
  land_area_m2?: number | null;
  floors_in_building?: number | null;
  unit_floor?: number | null;
  year_built?: number | null;

  // Ubicación
  address_street?: string | null;
  address_ext_number?: string | null;
  address_int_number?: string | null;
  colonia?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  state_id?: string | null;
  city_id?: string | null;
  public_latitude?: number | null;
  public_longitude?: number | null;
  location_precision?: "exact" | "approximate";
  show_exact_location?: boolean;

  // Multimedia & Ficha
  amenity_ids: string[];
  images: PropertyImageItem[];
  video_url?: string | null;
  virtual_tour_url?: string | null;
  featured: boolean;
  views_count?: number;

  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  organization_id: string;
  agent_id?: string | null;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  source: "portal_web" | "facebook" | "directo" | "referido" | "otro";
  status: "nuevo" | "en_seguimiento" | "calificado" | "cerrado" | "descartado";
  interest_type?: "compra" | "renta" | "venta";
  budget_min?: number | null;
  budget_max?: number | null;
  property_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface PropertyOwner {
  id: string;
  organization_id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  tax_id?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  organization_id: string;
  agent_id?: string | null;
  assigned_to?: string | null;
  property_id?: string | null;
  contact_id?: string | null;
  owner_id?: string | null;
  type: "llamada" | "reunion" | "visita" | "seguimiento" | "tarea" | "otro";
  status: "pendiente" | "completada" | "cancelada";
  scheduled_at?: string | null;
  completed_at?: string | null;
  description: string;
  notes?: string | null;
  created_at: string;
}

export interface PropertyDocument {
  id: string;
  organization_id: string;
  property_id: string;
  category: string;
  document_type: string;
  file_path?: string | null;
  file_url?: string | null;
  status: "pendiente" | "en_revision" | "aprobado" | "rechazado";
  notes?: string | null;
  uploaded_by?: string | null;
  uploaded_at?: string | null;
  created_at: string;
}

export interface PropertyInquiry {
  id: string;
  organization_id: string;
  property_id: string;
  contact_id?: string | null;
  name: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  created_at: string;
}
