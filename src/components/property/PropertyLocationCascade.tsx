import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  COUNTRIES,
  STATES_MX,
  CITIES_BY_STATE,
  type LocationOption,
} from "@/lib/catalogs/mexico-locations";

export type LocationSelection = {
  country_id: string | null;
  state_id: string | null;
  city_id: string | null;
  country_name: string | null;
  state_name: string | null;
  city_name: string | null;
};

function LocationCombobox({
  label,
  placeholder,
  options,
  value,
  onSelect,
  disabled,
}: {
  label: string;
  placeholder: string;
  options: LocationOption[];
  value: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            <span className={cn(!selected && "text-muted-foreground")}>
              {selected ? selected.name : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder={`Buscar ${label.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>Sin resultados.</CommandEmpty>
              <CommandGroup>
                {options.map((o) => (
                  <CommandItem
                    key={o.id}
                    value={o.name}
                    onSelect={() => {
                      onSelect(o.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === o.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {o.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function PropertyLocationCascade({
  value,
  onChange,
}: {
  value: {
    country_id: string | null;
    state_id: string | null;
    city_id: string | null;
  };
  onChange: (selection: LocationSelection) => void;
}) {
  const countries = COUNTRIES;
  const states = STATES_MX;

  const cities = useMemo(() => {
    if (!value.state_id) return [];
    return CITIES_BY_STATE[value.state_id] || [
      { id: `${value.state_id}_principal`, name: "Cabecera / Centro" },
    ];
  }, [value.state_id]);

  const handleCountrySelect = (countryId: string) => {
    const country = countries.find((c) => c.id === countryId);
    onChange({
      country_id: countryId,
      country_name: country?.name ?? null,
      state_id: null,
      state_name: null,
      city_id: null,
      city_name: null,
    });
  };

  const handleStateSelect = (stateId: string) => {
    const country = countries.find((c) => c.id === value.country_id) ?? countries[0];
    const state = states.find((s) => s.id === stateId);
    onChange({
      country_id: country.id,
      country_name: country.name,
      state_id: stateId,
      state_name: state?.name ?? null,
      city_id: null,
      city_name: null,
    });
  };

  const handleCitySelect = (cityId: string) => {
    const country = countries.find((c) => c.id === value.country_id) ?? countries[0];
    const state = states.find((s) => s.id === value.state_id);
    const city = cities.find((c) => c.id === cityId);
    onChange({
      country_id: country.id,
      country_name: country.name,
      state_id: value.state_id,
      state_name: state?.name ?? null,
      city_id: cityId,
      city_name: city?.name ?? null,
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <LocationCombobox
        label="País"
        placeholder="Selecciona país"
        options={countries}
        value={value.country_id || "mx"}
        onSelect={handleCountrySelect}
      />
      <LocationCombobox
        label="Estado"
        placeholder="Selecciona estado"
        options={states}
        value={value.state_id}
        onSelect={handleStateSelect}
      />
      <LocationCombobox
        label="Municipio / Ciudad"
        placeholder={value.state_id ? "Selecciona ciudad" : "Elige estado primero"}
        options={cities}
        value={value.city_id}
        onSelect={handleCitySelect}
        disabled={!value.state_id}
      />
    </div>
  );
}
