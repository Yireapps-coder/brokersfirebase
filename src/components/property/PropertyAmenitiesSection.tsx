import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AMENITY_GROUPS } from "@/lib/property-catalog";

export function PropertyAmenitiesSection({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const selected = new Set(value);

  const toggle = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    onChange(Array.from(next));
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Amenidades</h3>
          <p className="text-xs text-muted-foreground">
            Selecciona las amenidades que ofrece la propiedad.
          </p>
        </div>

        {AMENITY_GROUPS.map((group) => (
          <div key={group.category} className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </h4>
            <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.options.map((amenity) => {
                const checkboxId = `amenity-${amenity.id}`;
                return (
                  <div key={amenity.id} className="flex items-center gap-2">
                    <Checkbox
                      id={checkboxId}
                      checked={selected.has(amenity.id)}
                      onCheckedChange={(c) => toggle(amenity.id, c === true)}
                    />
                    <Label
                      htmlFor={checkboxId}
                      className="cursor-pointer text-sm font-normal text-foreground"
                    >
                      {amenity.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
