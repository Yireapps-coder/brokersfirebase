import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PROPERTY_TYPE_GROUPS, propertyTypeLabel } from "@/lib/property-catalog";
import type { PropertyType } from "@/lib/property-catalog";

export function PropertyTypeSelect({
  id,
  value,
  onChange,
  placeholder = "Todos los tipos",
}: {
  id?: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value ? propertyTypeLabel(value as PropertyType) : placeholder}
          </span>
          {value ? (
            <X
              className="h-4 w-4 shrink-0 opacity-60 hover:opacity-100"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(undefined);
              }}
            />
          ) : (
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar tipo..." />
          <CommandList>
            <CommandEmpty>Sin coincidencias.</CommandEmpty>
            {PROPERTY_TYPE_GROUPS.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={`${group.label} ${opt.label}`}
                    onSelect={() => {
                      onChange(opt.value === value ? undefined : opt.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === opt.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
