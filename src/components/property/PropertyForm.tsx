import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { saveProperty } from "@/integrations/firebase/services/properties.service";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PropertyTypeSelect } from "@/components/property/PropertyTypeSelect";
import {
  PropertyOperationsSection,
  type OperationsState,
} from "@/components/property/PropertyOperationsSection";
import { PropertyAmenitiesSection } from "@/components/property/PropertyAmenitiesSection";
import { PropertyImagesSection } from "@/components/property/PropertyImagesSection";
import { parsePropertyImages, type PropertyImage } from "@/lib/property-images";
import { parseMediaLinks, type MediaLink } from "@/lib/media-links";
import {
  PropertyLocationCascade,
  type LocationSelection,
} from "@/components/property/PropertyLocationCascade";
import { PropertyLocationPicker } from "@/components/property/PropertyLocationPicker";
import {
  categoryForPropertyType,
  isFieldVisible,
  CONSERVATION_STATE_OPTIONS,
  DISPOSITION_OPTIONS,
  ORIENTATION_OPTIONS,
  PROPERTY_CATEGORY_LABELS,
  type PropertyType,
  type RentalCommissionType,
  type SaleCommissionType,
} from "@/lib/property-catalog";
import { PROPERTY_STATUS_LABELS } from "@/lib/format";
import type { Property, PropertyStatus } from "@/integrations/firebase/types";

type FormState = {
  title: string;
  description: string;
  internal_id: string;
  property_type: PropertyType;
  status: PropertyStatus;
  publish_prices: boolean;
  price_based_on: "total" | "per_m2";
  financing_terms: string;
  is_exclusive: "unspecified" | "yes" | "no";
  share_commission: boolean;
  shared_commission_percentage: string;
  collaboration_notes: string;
  country_id: string;
  state_id: string;
  city_id: string;
  city: string;
  state: string;
  colonia: string;
  address_street: string;
  address_ext_number: string;
  address_int_number: string;
  zip_code: string;
  cross_street: string;
  key_code: string;
  latitude: string;
  longitude: string;
  location_precision: "exact" | "approximate";
  bedrooms: string;
  bathrooms: string;
  half_bathrooms: string;
  parking_spaces: string;
  construction_area_m2: string;
  uncovered_area_m2: string;
  land_area_m2: string;
  lot_width_m: string;
  lot_length_m: string;
  floors_in_building: string;
  unit_floor: string;
  year_built: string;
  maintenance_fee_monthly: string;
  conservation_state: string;
  disposition: string;
  orientation: string;
  amenity_ids: string[];
} & OperationsState;

function numOrEmpty(v: number | null | undefined): string {
  return v != null ? String(v) : "";
}

function toFormState(p?: Property | null): FormState {
  return {
    title: p?.title ?? "",
    description: p?.description ?? "",
    internal_id: p?.internal_id ?? "",
    property_type: (p?.property_type as PropertyType) ?? "casa",
    status: (p?.status as PropertyStatus) ?? "disponible",
    publish_prices: p?.publish_prices ?? true,
    price_based_on: (p?.price_based_on as "total" | "per_m2") ?? "total",
    financing_terms: p?.financing_terms ?? "",
    is_exclusive: p?.is_exclusive == null ? "unspecified" : p.is_exclusive ? "yes" : "no",
    share_commission: p?.share_commission ?? true,
    shared_commission_percentage: numOrEmpty(p?.shared_commission_percentage ?? 50),
    collaboration_notes: p?.collaboration_notes ?? "",
    country_id: p?.country_id ?? "",
    state_id: p?.state_id ?? "",
    city_id: p?.city_id ?? "",
    city: p?.city ?? "",
    state: p?.state ?? "",
    colonia: p?.colonia ?? "",
    address_street: p?.address_street ?? "",
    address_ext_number: p?.address_ext_number ?? "",
    address_int_number: p?.address_int_number ?? "",
    zip_code: p?.zip_code ?? "",
    cross_street: p?.cross_street ?? "",
    key_code: p?.key_code ?? "",
    latitude: numOrEmpty(p?.latitude),
    longitude: numOrEmpty(p?.longitude),
    location_precision:
      (p?.location_precision as "exact" | "approximate") ?? "approximate",
    bedrooms: numOrEmpty(p?.bedrooms),
    bathrooms: numOrEmpty(p?.bathrooms),
    half_bathrooms: numOrEmpty(p?.half_bathrooms),
    parking_spaces: numOrEmpty(p?.parking_spaces),
    construction_area_m2: numOrEmpty(p?.construction_area_m2),
    uncovered_area_m2: numOrEmpty(p?.uncovered_area_m2),
    land_area_m2: numOrEmpty(p?.land_area_m2),
    lot_width_m: numOrEmpty(p?.lot_width_m),
    lot_length_m: numOrEmpty(p?.lot_length_m),
    floors_in_building: numOrEmpty(p?.floors_in_building),
    unit_floor: numOrEmpty(p?.unit_floor),
    year_built: numOrEmpty(p?.year_built),
    maintenance_fee_monthly: numOrEmpty(p?.maintenance_fee_monthly),
    conservation_state: p?.conservation_state ?? "",
    disposition: p?.disposition ?? "",
    orientation: p?.orientation ?? "",
    amenity_ids: p?.amenity_ids ?? [],
    // Operations
    for_sale: p?.for_sale ?? false,
    for_rent: p?.for_rent ?? false,
    for_temporary_rent: p?.for_temporary_rent ?? false,
    sale_price: numOrEmpty(p?.sale_price),
    sale_currency: p?.sale_currency ?? "MXN",
    sale_commission_type: (p?.sale_commission_type as SaleCommissionType) ?? "unspecified",
    sale_commission_value: numOrEmpty(p?.sale_commission_value),
    is_foreclosure: p?.is_foreclosure ?? false,
    financing_option_ids: p?.financing_option_ids ?? [],
    rent_price: numOrEmpty(p?.rent_price),
    rent_currency: p?.rent_currency ?? "MXN",
    rental_commission_type:
      (p?.rental_commission_type as RentalCommissionType) ?? "unspecified",
    rental_commission_value: numOrEmpty(p?.rental_commission_value),
    daily_rate: numOrEmpty(p?.daily_rate),
    weekly_rate: numOrEmpty(p?.weekly_rate),
    monthly_rate: numOrEmpty(p?.monthly_rate),
    minimum_stay_nights: numOrEmpty(p?.minimum_stay_nights),
    max_guests: numOrEmpty(p?.max_guests),
  };
}

const numOrNull = (v: string): number | null =>
  v.trim() === "" || Number.isNaN(Number(v)) ? null : Number(v);

export function PropertyForm({ property }: { property?: Property | null }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!property;

  const [form, setForm] = useState<FormState>(() => toFormState(property));
  const [images, setImages] = useState<PropertyImage[]>(() =>
    parsePropertyImages(property?.images),
  );
  const [mediaLinks, setMediaLinks] = useState<MediaLink[]>(() =>
    parseMediaLinks(property?.media_links),
  );

  // Stable id used both for the storage path and the inserted row, so new
  // properties can upload images before the row exists.
  const propertyId = useMemo(
    () => property?.id ?? crypto.randomUUID(),
    [property?.id],
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setOps = (patch: Partial<OperationsState>) =>
    setForm((f) => ({ ...f, ...patch }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id) throw new Error("Sin organización");

      const category = categoryForPropertyType(form.property_type);

      // Legacy display columns kept in sync for listings/SEO pages.
      const legacyOperation = form.for_sale ? "venta" : "renta";
      const legacyPrice = form.for_sale
        ? numOrNull(form.sale_price)
        : numOrNull(form.rent_price);
      const legacyCurrency = form.for_sale ? form.sale_currency : form.rent_currency;

      // folio + slug are generated by the set_property_slug DB trigger.
      const payload: Omit<TablesInsert<"properties">, "folio" | "slug"> = {
        id: propertyId,
        organization_id: profile.organization_id,
        agent_id: property?.agent_id ?? profile.id,
        images: images as unknown as TablesInsert<"properties">["images"],
        media_links: mediaLinks
          .map((l) => ({ url: l.url.trim(), title: l.title?.trim() || undefined }))
          .filter((l) => l.url !== "") as unknown as TablesInsert<"properties">["media_links"],
        title: form.title.trim(),
        description: form.description.trim() || null,
        internal_id: form.internal_id.trim() || null,
        property_type: form.property_type,
        category,
        status: form.status,
        publish_prices: form.publish_prices,
        price_based_on: form.price_based_on,
        financing_terms:
          form.for_sale && category === "residential"
            ? form.financing_terms.trim() || null
            : null,
        is_exclusive:
          form.is_exclusive === "unspecified" ? null : form.is_exclusive === "yes",
        share_commission: form.share_commission,
        shared_commission_percentage:
          numOrNull(form.shared_commission_percentage) ?? 50,
        collaboration_notes: form.collaboration_notes.trim() || null,
        operation_type: legacyOperation,
        price: legacyPrice ?? 0,
        currency: legacyCurrency,
        country_id: form.country_id || null,
        state_id: form.state_id || null,
        city_id: form.city_id || null,
        address_street: form.address_street.trim() || null,
        address_ext_number: form.address_ext_number.trim() || null,
        address_int_number: form.address_int_number.trim() || null,
        cross_street: form.cross_street.trim() || null,
        key_code: form.key_code.trim() || null,
        latitude: numOrNull(form.latitude),
        longitude: numOrNull(form.longitude),
        location_precision: form.location_precision,
        // Kept in sync with location_precision for backwards-compat columns.
        show_exact_location: form.location_precision === "exact",
        // Legacy composed address + city/state text kept in sync for listings/SEO.
        address:
          [
            form.address_street.trim(),
            form.address_ext_number.trim() && `#${form.address_ext_number.trim()}`,
            form.address_int_number.trim() && `Int. ${form.address_int_number.trim()}`,
          ]
            .filter(Boolean)
            .join(" ") || null,
        colonia: form.colonia.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        zip_code: form.zip_code.trim() || null,
        bedrooms: isFieldVisible("bedrooms", category) ? numOrNull(form.bedrooms) : null,
        bathrooms: isFieldVisible("bathrooms", category) ? numOrNull(form.bathrooms) : null,
        half_bathrooms: isFieldVisible("half_bathrooms", category)
          ? numOrNull(form.half_bathrooms)
          : null,
        parking_spaces: isFieldVisible("parking_spaces", category)
          ? numOrNull(form.parking_spaces)
          : null,
        construction_area_m2: isFieldVisible("construction_area_m2", category)
          ? numOrNull(form.construction_area_m2)
          : null,
        uncovered_area_m2: isFieldVisible("uncovered_area_m2", category)
          ? numOrNull(form.uncovered_area_m2)
          : null,
        land_area_m2: isFieldVisible("lot_size_m2", category)
          ? numOrNull(form.land_area_m2)
          : null,
        lot_width_m: isFieldVisible("lot_width_m", category)
          ? numOrNull(form.lot_width_m)
          : null,
        lot_length_m: isFieldVisible("lot_length_m", category)
          ? numOrNull(form.lot_length_m)
          : null,
        floors_in_building: isFieldVisible("floors_in_building", category)
          ? numOrNull(form.floors_in_building)
          : null,
        unit_floor: isFieldVisible("unit_floor", category)
          ? numOrNull(form.unit_floor)
          : null,
        year_built: isFieldVisible("year_built", category)
          ? numOrNull(form.year_built)
          : null,
        maintenance_fee_monthly: isFieldVisible("maintenance_fee_monthly", category)
          ? numOrNull(form.maintenance_fee_monthly)
          : null,
        conservation_state: isFieldVisible("conservation_state", category)
          ? form.conservation_state || null
          : null,
        disposition: isFieldVisible("disposition", category)
          ? form.disposition || null
          : null,
        orientation: isFieldVisible("orientation", category)
          ? form.orientation || null
          : null,
        amenity_ids: form.amenity_ids,
        // Operations
        for_sale: form.for_sale,
        for_rent: form.for_rent,
        for_temporary_rent: form.for_temporary_rent,
        sale_price: form.for_sale ? numOrNull(form.sale_price) : null,
        sale_currency: form.sale_currency,
        sale_commission_type: form.sale_commission_type,
        sale_commission_value: form.for_sale
          ? numOrNull(form.sale_commission_value)
          : null,
        is_foreclosure: form.for_sale ? form.is_foreclosure : false,
        financing_option_ids:
          form.for_sale && category === "residential" ? form.financing_option_ids : [],
        rent_price: form.for_rent ? numOrNull(form.rent_price) : null,
        rent_currency: form.rent_currency,
        rental_commission_type: form.rental_commission_type,
        rental_commission_value: form.for_rent
          ? numOrNull(form.rental_commission_value)
          : null,
        daily_rate: form.for_temporary_rent ? numOrNull(form.daily_rate) : null,
        weekly_rate: form.for_temporary_rent ? numOrNull(form.weekly_rate) : null,
        monthly_rate: form.for_temporary_rent ? numOrNull(form.monthly_rate) : null,
        minimum_stay_nights: form.for_temporary_rent
          ? numOrNull(form.minimum_stay_nights)
          : null,
        max_guests: form.for_temporary_rent ? numOrNull(form.max_guests) : null,
      };

      await saveProperty({ ...payload, id: isEdit ? property!.id : undefined } as any);
    },
    onSuccess: async () => {
      // Refetch every related cache entry (list + this property's detail) so
      // image additions/removals show without a manual page refresh.
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["crm-properties"],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["crm-property", propertyId],
          refetchType: "all",
        }),
      ]);
      toast.success(isEdit ? "Propiedad actualizada" : "Propiedad creada");
      navigate({ to: "/crm/propiedades" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error al guardar"),
  });

  const derivedCategory = categoryForPropertyType(form.property_type);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.title.trim()) {
          toast.error("El título es obligatorio");
          return;
        }
        if (!form.for_sale && !form.for_rent && !form.for_temporary_rent) {
          toast.error("Activa al menos una operación (venta, renta o renta temporal)");
          return;
        }
        if (form.status === "disponible" && images.length === 0) {
          toast.error(
            "Agrega al menos una imagen para publicar la propiedad como disponible",
          );
          return;
        }
        mutation.mutate();
      }}
    >
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Ej. Casa con 3 recámaras en Cholul"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="internal_id">ID interno</Label>
              <Input
                id="internal_id"
                value={form.internal_id || "Se generará automáticamente"}
                readOnly
                disabled
                className="bg-muted text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Se asigna automáticamente y es único e irrepetible. Se usa para
                ligar la propiedad con sus documentos.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="property_type">Tipo de propiedad</Label>
              <PropertyTypeSelect
                id="property_type"
                value={form.property_type}
                onChange={(v) => v && set("property_type", v as PropertyType)}
              />
              <p className="text-xs text-muted-foreground">
                Categoría: {PROPERTY_CATEGORY_LABELS[derivedCategory]}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estatus</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as PropertyStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROPERTY_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe la propiedad..."
            />
          </div>
        </CardContent>
      </Card>

      {profile?.organization_id && (
        <PropertyImagesSection
          orgId={profile.organization_id}
          propertyId={propertyId}
          altBase={
            [form.title.trim(), form.city.trim()].filter(Boolean).join(" en ") ||
            form.title.trim()
          }
          value={images}
          onChange={setImages}
        />
      )}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              Videos y redes sociales
            </h3>
            <p className="text-xs text-muted-foreground">
              Agrega enlaces de YouTube, Vimeo o redes sociales. Se mostrarán en la
              página pública de la propiedad.
            </p>
          </div>

          {mediaLinks.length > 0 && (
            <div className="space-y-3">
              {mediaLinks.map((link, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Input
                    type="url"
                    inputMode="url"
                    placeholder="https://youtube.com/watch?v=…"
                    value={link.url}
                    onChange={(e) =>
                      setMediaLinks((arr) =>
                        arr.map((l, idx) =>
                          idx === i ? { ...l, url: e.target.value } : l,
                        ),
                      )
                    }
                  />
                  <Input
                    placeholder="Título (opcional)"
                    value={link.title ?? ""}
                    onChange={(e) =>
                      setMediaLinks((arr) =>
                        arr.map((l, idx) =>
                          idx === i ? { ...l, title: e.target.value } : l,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setMediaLinks((arr) => arr.filter((_, idx) => idx !== i))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Eliminar enlace</span>
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMediaLinks((arr) => [...arr, { url: "", title: "" }])}
          >
            <Plus className="h-4 w-4" />
            Agregar enlace
          </Button>
        </CardContent>
      </Card>

      <PropertyOperationsSection
        value={form}
        onChange={setOps}
        category={derivedCategory}
      />

      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="text-sm font-semibold text-foreground">
            Publicación de precios
          </h3>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="publish_prices">Mostrar precios en el anuncio</Label>
              <p className="text-xs text-muted-foreground">
                Si lo desactivas, el precio no se mostrará públicamente.
              </p>
            </div>
            <Switch
              id="publish_prices"
              checked={form.publish_prices}
              onCheckedChange={(v) => set("publish_prices", v)}
            />
          </div>

          <div className="space-y-2 sm:max-w-xs">
            <Label htmlFor="price_based_on">Precio basado en</Label>
            <Select
              value={form.price_based_on}
              onValueChange={(v) =>
                set("price_based_on", v as FormState["price_based_on"])
              }
            >
              <SelectTrigger id="price_based_on">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">Precio total</SelectItem>
                <SelectItem value="per_m2">Precio por m²</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.for_sale && derivedCategory === "residential" && (
            <div className="space-y-2">
              <Label htmlFor="financing_terms">
                Condiciones de financiamiento
              </Label>
              <Textarea
                id="financing_terms"
                rows={3}
                value={form.financing_terms}
                onChange={(e) => set("financing_terms", e.target.value)}
                placeholder="Ej. Acepta crédito bancario e INFONAVIT..."
              />
            </div>
          )}
        </CardContent>
      </Card>


      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="text-sm font-semibold text-foreground">Ubicación</h3>

          <PropertyLocationCascade
            value={{
              country_id: form.country_id || null,
              state_id: form.state_id || null,
              city_id: form.city_id || null,
            }}
            onChange={(s: LocationSelection) =>
              setForm((f) => ({
                ...f,
                country_id: s.country_id ?? "",
                state_id: s.state_id ?? "",
                city_id: s.city_id ?? "",
                state: s.state_name ?? "",
                city: s.city_name ?? "",
              }))
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="colonia">Colonia</Label>
              <Input
                id="colonia"
                value={form.colonia}
                onChange={(e) => set("colonia", e.target.value)}
                placeholder="Ej. Centro, Montecristo…"
              />
              <p className="text-xs text-muted-foreground">
                Escribe el nombre de la colonia o fraccionamiento.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_street">Calle</Label>
              <Input
                id="address_street"
                value={form.address_street}
                onChange={(e) => set("address_street", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_ext_number">No. exterior</Label>
                <Input
                  id="address_ext_number"
                  value={form.address_ext_number}
                  onChange={(e) => set("address_ext_number", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_int_number">No. interior</Label>
                <Input
                  id="address_int_number"
                  value={form.address_int_number}
                  onChange={(e) => set("address_int_number", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">Código postal</Label>
              <Input
                id="zip_code"
                value={form.zip_code}
                onChange={(e) => set("zip_code", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cross_street">Esquina con</Label>
              <Input
                id="cross_street"
                value={form.cross_street}
                onChange={(e) => set("cross_street", e.target.value)}
                placeholder="Calle de cruce o referencia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key_code">Código de la llave</Label>
              <Input
                id="key_code"
                value={form.key_code}
                onChange={(e) => set("key_code", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Uso interno; no se muestra en el anuncio.
              </p>
            </div>
          </div>

        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="text-sm font-semibold text-foreground">
            Ubicación en el mapa
          </h3>
          <p className="text-xs text-muted-foreground">
            Ajusta el pin a la ubicación exacta del inmueble. Estas coordenadas
            son internas; en el portal público se muestra la ubicación según la
            precisión seleccionada.
          </p>

          <PropertyLocationPicker
            latitude={numOrNull(form.latitude)}
            longitude={numOrNull(form.longitude)}
            geocodeQuery={[
              form.address_street,
              form.address_ext_number,
              form.colonia,
              form.city,
              form.state,
              "México",
            ]
              .map((s) => s.trim())
              .filter(Boolean)
              .join(", ")}
            onChange={(lat, lng) =>
              setForm((f) => ({
                ...f,
                latitude: String(lat),
                longitude: String(lng),
              }))
            }
          />

          {form.latitude && form.longitude ? (
            <p className="text-xs text-muted-foreground">
              Coordenadas: {Number(form.latitude).toFixed(6)},{" "}
              {Number(form.longitude).toFixed(6)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Aún no se ha fijado una ubicación en el mapa.
            </p>
          )}

          <div className="space-y-2 rounded-lg border border-border p-3">
            <Label>Precisión de la ubicación pública</Label>
            <RadioGroup
              value={form.location_precision}
              onValueChange={(v) =>
                set("location_precision", v as "exact" | "approximate")
              }
              className="gap-2"
            >
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <RadioGroupItem value="approximate" className="mt-0.5" />
                <span>
                  <span className="font-medium text-foreground">
                    Ubicación aproximada
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    En el portal el pin se muestra desplazado ~100–300 m (opción
                    recomendada).
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <RadioGroupItem value="exact" className="mt-0.5" />
                <span>
                  <span className="font-medium text-foreground">
                    Ubicación exacta
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    En el portal el pin se muestra en la ubicación exacta.
                  </span>
                </span>
              </label>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="text-sm font-semibold text-foreground">Características</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {isFieldVisible("bedrooms", derivedCategory) && (
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Recámaras</Label>
                <Input id="bedrooms" type="number" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} />
              </div>
            )}
            {isFieldVisible("bathrooms", derivedCategory) && (
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Baños</Label>
                <Input id="bathrooms" type="number" step="0.5" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} />
              </div>
            )}
            {isFieldVisible("half_bathrooms", derivedCategory) && (
              <div className="space-y-2">
                <Label htmlFor="half_bathrooms">Medios baños</Label>
                <Input id="half_bathrooms" type="number" value={form.half_bathrooms} onChange={(e) => set("half_bathrooms", e.target.value)} />
              </div>
            )}
            {isFieldVisible("parking_spaces", derivedCategory) && (
              <div className="space-y-2">
                <Label htmlFor="parking_spaces">Estacionamientos</Label>
                <Input id="parking_spaces" type="number" value={form.parking_spaces} onChange={(e) => set("parking_spaces", e.target.value)} />
              </div>
            )}
            {isFieldVisible("construction_area_m2", derivedCategory) && (
              <div className="space-y-2">
                <Label htmlFor="construction_area_m2">Construcción (m²)</Label>
                <Input id="construction_area_m2" type="number" value={form.construction_area_m2} onChange={(e) => set("construction_area_m2", e.target.value)} />
              </div>
            )}
            {isFieldVisible("uncovered_area_m2", derivedCategory) && (
              <div className="space-y-2">
                <Label htmlFor="uncovered_area_m2">Superficie no cubierta (m²)</Label>
                <Input id="uncovered_area_m2" type="number" value={form.uncovered_area_m2} onChange={(e) => set("uncovered_area_m2", e.target.value)} />
              </div>
            )}
            {isFieldVisible("lot_size_m2", derivedCategory) && (
              <div className="space-y-2">
                <Label htmlFor="land_area_m2">Terreno (m²)</Label>
                <Input id="land_area_m2" type="number" value={form.land_area_m2} onChange={(e) => set("land_area_m2", e.target.value)} />
              </div>
            )}
            {isFieldVisible("lot_width_m", derivedCategory) && (
              <div className="space-y-2">
                <Label htmlFor="lot_width_m">Frente del terreno (m)</Label>
                <Input id="lot_width_m" type="number" value={form.lot_width_m} onChange={(e) => set("lot_width_m", e.target.value)} />
              </div>
            )}
            {isFieldVisible("lot_length_m", derivedCategory) && (
              <div className="space-y-2">
                <Label htmlFor="lot_length_m">Fondo del terreno (m)</Label>
                <Input id="lot_length_m" type="number" value={form.lot_length_m} onChange={(e) => set("lot_length_m", e.target.value)} />
              </div>
            )}
            {isFieldVisible("floors_in_building", derivedCategory) && (
              <div className="space-y-2">
                <Label htmlFor="floors_in_building">Niveles del edificio</Label>
                <Input id="floors_in_building" type="number" value={form.floors_in_building} onChange={(e) => set("floors_in_building", e.target.value)} />
              </div>
            )}
            {isFieldVisible("unit_floor", derivedCategory) && (
              <div className="space-y-2">
                <Label htmlFor="unit_floor">Piso en el que se encuentra</Label>
                <Input id="unit_floor" type="number" value={form.unit_floor} onChange={(e) => set("unit_floor", e.target.value)} />
              </div>
            )}
            {isFieldVisible("year_built", derivedCategory) && (
              <div className="space-y-2">
                <Label htmlFor="year_built">Año de construcción</Label>
                <Input id="year_built" type="number" value={form.year_built} onChange={(e) => set("year_built", e.target.value)} />
              </div>
            )}
            {isFieldVisible("maintenance_fee_monthly", derivedCategory) && (
              <div className="space-y-2">
                <Label htmlFor="maintenance_fee_monthly">Mantenimiento mensual</Label>
                <Input id="maintenance_fee_monthly" type="number" value={form.maintenance_fee_monthly} onChange={(e) => set("maintenance_fee_monthly", e.target.value)} />
              </div>
            )}
            {isFieldVisible("conservation_state", derivedCategory) && (
              <div className="space-y-2">
                <Label htmlFor="conservation_state">Estado de conservación</Label>
                <Select
                  value={form.conservation_state || "__none__"}
                  onValueChange={(v) => set("conservation_state", v === "__none__" ? "" : v)}
                >
                  <SelectTrigger id="conservation_state">
                    <SelectValue placeholder="Sin especificar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin especificar</SelectItem>
                    {CONSERVATION_STATE_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {isFieldVisible("disposition", derivedCategory) && (
              <div className="space-y-2">
                <Label htmlFor="disposition">Disposición</Label>
                <Select
                  value={form.disposition || "__none__"}
                  onValueChange={(v) => set("disposition", v === "__none__" ? "" : v)}
                >
                  <SelectTrigger id="disposition">
                    <SelectValue placeholder="Sin especificar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin especificar</SelectItem>
                    {DISPOSITION_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {isFieldVisible("orientation", derivedCategory) && (
              <div className="space-y-2">
                <Label htmlFor="orientation">Orientación</Label>
                <Select
                  value={form.orientation || "__none__"}
                  onValueChange={(v) => set("orientation", v === "__none__" ? "" : v)}
                >
                  <SelectTrigger id="orientation">
                    <SelectValue placeholder="Sin especificar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin especificar</SelectItem>
                    {ORIENTATION_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <PropertyAmenitiesSection
        value={form.amenity_ids}
        onChange={(next) => set("amenity_ids", next)}
      />

      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="text-sm font-semibold text-foreground">
            Compartir y exclusividad
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="is_exclusive">Exclusiva</Label>
              <Select
                value={form.is_exclusive}
                onValueChange={(v) =>
                  set("is_exclusive", v as FormState["is_exclusive"])
                }
              >
                <SelectTrigger id="is_exclusive">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unspecified">Sin especificar</SelectItem>
                  <SelectItem value="yes">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="share_commission">Compartir comisión</Label>
              <p className="text-xs text-muted-foreground">
                Comparte la comisión con otros asesores que colaboren.
              </p>
            </div>
            <Switch
              id="share_commission"
              checked={form.share_commission}
              onCheckedChange={(v) => set("share_commission", v)}
            />
          </div>

          {form.share_commission && (
            <div className="space-y-2 sm:max-w-xs">
              <Label htmlFor="shared_commission_percentage">
                Porcentaje a compartir (%)
              </Label>
              <Input
                id="shared_commission_percentage"
                type="number"
                min={0}
                max={100}
                step="0.5"
                value={form.shared_commission_percentage}
                onChange={(e) =>
                  set("shared_commission_percentage", e.target.value)
                }
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="collaboration_notes">Notas de colaboración</Label>
            <Textarea
              id="collaboration_notes"
              rows={3}
              value={form.collaboration_notes}
              onChange={(e) => set("collaboration_notes", e.target.value)}
              placeholder="Condiciones para colaborar con otros asesores..."
            />
          </div>
        </CardContent>
      </Card>





      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: "/crm/propiedades" })}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear propiedad"}
        </Button>
      </div>
    </form>
  );
}

