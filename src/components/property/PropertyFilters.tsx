import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PropertyTypeSelect } from "@/components/property/PropertyTypeSelect";
import {
  BEDROOM_OPTIONS,
  LAND_SIZE_RANGES,
  activeFilterCount,
  type PropertySearchFilters,
} from "@/lib/property-filters";

type Props = {
  value: PropertySearchFilters;
  onChange: (patch: Partial<PropertySearchFilters>) => void;
  onClear: () => void;
  colonias: string[];
};

function parseNum(v: string): number | undefined {
  const n = Number(v.replace(/[^0-9.]/g, ""));
  return v.trim() && Number.isFinite(n) ? n : undefined;
}

export function PropertyFilters({ value, onChange, onClear, colonias }: Props) {
  const [keyword, setKeyword] = useState(value.q ?? "");
  const [priceMin, setPriceMin] = useState(value.priceMin?.toString() ?? "");
  const [priceMax, setPriceMax] = useState(value.priceMax?.toString() ?? "");
  const [colonia, setColonia] = useState(value.colonia ?? "");

  // Keep local text inputs in sync when filters are cleared/changed externally.
  useEffect(() => setKeyword(value.q ?? ""), [value.q]);
  useEffect(() => setPriceMin(value.priceMin?.toString() ?? ""), [value.priceMin]);
  useEffect(() => setPriceMax(value.priceMax?.toString() ?? ""), [value.priceMax]);
  useEffect(() => setColonia(value.colonia ?? ""), [value.colonia]);

  const count = activeFilterCount(value);

  return (
    <div className="space-y-5">
      {/* Quick keyword search */}
      <div className="space-y-2">
        <Label htmlFor="filter-q">Palabra clave</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="filter-q"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onBlur={() => onChange({ q: keyword.trim() || undefined })}
            onKeyDown={(e) => {
              if (e.key === "Enter") onChange({ q: keyword.trim() || undefined });
            }}
            placeholder="Escribe una palabra clave y presiona enter"
            className="pl-9"
          />
        </div>
      </div>

      {/* Operation toggle */}
      <div className="space-y-2">
        <Label>Operación</Label>
        <ToggleGroup
          type="single"
          value={value.operation ?? ""}
          onValueChange={(v) =>
            onChange({
              operation: v === "venta" || v === "renta" ? v : undefined,
            })
          }
          className="grid grid-cols-2 gap-2"
        >
          <ToggleGroupItem
            value="venta"
            className="border border-border data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Venta
          </ToggleGroupItem>
          <ToggleGroupItem
            value="renta"
            className="border border-border data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Renta
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Property type */}
      <div className="space-y-2">
        <Label>Tipo de propiedad</Label>
        <PropertyTypeSelect
          value={value.type}
          onChange={(v) => onChange({ type: v })}
        />
      </div>

      {/* Budget */}
      <div className="space-y-2">
        <Label>Presupuesto (MXN)</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            inputMode="numeric"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            onBlur={() => onChange({ priceMin: parseNum(priceMin) })}
            placeholder="Mínimo"
            aria-label="Presupuesto mínimo"
          />
          <Input
            inputMode="numeric"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            onBlur={() => onChange({ priceMax: parseNum(priceMax) })}
            placeholder="Máximo"
            aria-label="Presupuesto máximo"
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div className="space-y-2">
        <Label>Recámaras</Label>
        <Select
          value={value.bedrooms ?? "any"}
          onValueChange={(v) => onChange({ bedrooms: v === "any" ? undefined : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Cualquiera" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Cualquiera</SelectItem>
            {BEDROOM_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Land size */}
      <div className="space-y-2">
        <Label>Tamaño de terreno</Label>
        <Select
          value={value.land ?? "any"}
          onValueChange={(v) => onChange({ land: v === "any" ? undefined : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Cualquier tamaño" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Cualquier tamaño</SelectItem>
            {LAND_SIZE_RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Colonia autocomplete */}
      <div className="space-y-2">
        <Label htmlFor="filter-colonia">Colonia</Label>
        <Input
          id="filter-colonia"
          value={colonia}
          list="colonia-options"
          onChange={(e) => setColonia(e.target.value)}
          onBlur={() => onChange({ colonia: colonia.trim() || undefined })}
          onKeyDown={(e) => {
            if (e.key === "Enter") onChange({ colonia: colonia.trim() || undefined });
          }}
          placeholder="Busca por colonia"
        />
        <datalist id="colonia-options">
          {colonias.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      {count > 0 && (
        <Button variant="ghost" className="w-full" onClick={onClear}>
          Limpiar filtros ({count})
        </Button>
      )}
    </div>
  );
}
