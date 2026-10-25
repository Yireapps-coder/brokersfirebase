import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROPERTY_TYPE_GROUPS } from "@/lib/property-catalog";

const OPERATIONS = [
  { value: "todas", label: "Todas" },
  { value: "venta", label: "Venta" },
  { value: "renta", label: "Renta" },
] as const;

export function HeroSearch() {
  const navigate = useNavigate();
  const [operation, setOperation] = useState<(typeof OPERATIONS)[number]["value"]>(
    "todas",
  );
  const [type, setType] = useState<string>("todos");
  const [city, setCity] = useState("");

  const handleSearch = () => {
    navigate({
      to: "/propiedades",
      search: {
        operation: operation === "todas" ? undefined : operation,
        type: type === "todos" ? undefined : type,
        city: city.trim() || undefined,
      },
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-lg md:p-5">
      {/* Operation toggle */}
      <div className="inline-flex rounded-lg bg-muted p-1">
        {OPERATIONS.map((op) => (
          <button
            key={op.value}
            type="button"
            onClick={() => setOperation(op.value)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              operation === op.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {op.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger aria-label="Tipo de propiedad">
            <SelectValue placeholder="Tipo de propiedad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {PROPERTY_TYPE_GROUPS.map((g) => (
              <SelectGroup key={g.label}>
                <SelectLabel>{g.label}</SelectLabel>
                {g.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          placeholder="Ciudad"
          aria-label="Ciudad"
        />

        <Button variant="hero" size="lg" onClick={handleSearch} className="sm:w-auto">
          <Search className="h-4 w-4" /> Buscar
        </Button>
      </div>
    </div>
  );
}
