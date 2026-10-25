import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FINANCING_OPTIONS,
  OPERATION_CURRENCIES,
  RENTAL_COMMISSION_TYPE_LABELS,
  SALE_COMMISSION_TYPE_LABELS,
  type PropertyCategory,
  type RentalCommissionType,
  type SaleCommissionType,
} from "@/lib/property-catalog";

export type OperationsState = {
  for_sale: boolean;
  for_rent: boolean;
  for_temporary_rent: boolean;
  // Sale
  sale_price: string;
  sale_currency: string;
  sale_commission_type: SaleCommissionType;
  sale_commission_value: string;
  is_foreclosure: boolean;
  financing_option_ids: string[];
  // Rent
  rent_price: string;
  rent_currency: string;
  rental_commission_type: RentalCommissionType;
  rental_commission_value: string;
  // Temporary rent
  daily_rate: string;
  weekly_rate: string;
  monthly_rate: string;
  minimum_stay_nights: string;
  max_guests: string;
};

type Props = {
  value: OperationsState;
  onChange: (patch: Partial<OperationsState>) => void;
  category: PropertyCategory;
};

function CurrencySelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPERATION_CURRENCIES.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function OperationToggle({
  title,
  description,
  active,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  active: boolean;
  onToggle: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Collapsible open={active} className="rounded-lg border">
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{active ? "Sí" : "No"}</span>
          <Switch checked={active} onCheckedChange={onToggle} aria-label={title} />
        </div>
      </div>
      <CollapsibleContent>
        <div className="border-t p-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PropertyOperationsSection({ value: v, onChange, category }: Props) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Operaciones</h3>
          <p className="text-xs text-muted-foreground">
            Activa una o varias operaciones para esta propiedad.
          </p>
        </div>

        {/* Venta */}
        <OperationToggle
          title="Venta"
          description="La propiedad está disponible para venta."
          active={v.for_sale}
          onToggle={(checked) => onChange({ for_sale: checked })}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sale_price">Precio de venta</Label>
              <Input
                id="sale_price"
                type="number"
                inputMode="decimal"
                value={v.sale_price}
                onChange={(e) => onChange({ sale_price: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_currency">Moneda</Label>
              <CurrencySelect
                id="sale_currency"
                value={v.sale_currency}
                onChange={(val) => onChange({ sale_currency: val })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_commission_type">Tipo de comisión</Label>
              <Select
                value={v.sale_commission_type}
                onValueChange={(val) =>
                  onChange({ sale_commission_type: val as SaleCommissionType })
                }
              >
                <SelectTrigger id="sale_commission_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SALE_COMMISSION_TYPE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {v.sale_commission_type !== "unspecified" && (
              <div className="space-y-2">
                <Label htmlFor="sale_commission_value">Valor de comisión</Label>
                <Input
                  id="sale_commission_value"
                  type="number"
                  inputMode="decimal"
                  value={v.sale_commission_value}
                  onChange={(e) => onChange({ sale_commission_value: e.target.value })}
                  placeholder="0"
                />
              </div>
            )}
          </div>

          <label className="mt-4 flex items-center gap-2">
            <Checkbox
              checked={v.is_foreclosure}
              onCheckedChange={(checked) => onChange({ is_foreclosure: checked === true })}
            />
            <span className="text-sm text-foreground">Es remate / adjudicado</span>
          </label>

          {category === "residential" && (
            <div className="mt-4 space-y-2">
              <Label>Opciones de financiamiento</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {FINANCING_OPTIONS.map((opt) => {
                  const checked = v.financing_option_ids.includes(opt.id);
                  return (
                    <label key={opt.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => {
                          const next = c === true
                            ? [...v.financing_option_ids, opt.id]
                            : v.financing_option_ids.filter((id) => id !== opt.id);
                          onChange({ financing_option_ids: next });
                        }}
                      />
                      <span className="text-sm text-foreground">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </OperationToggle>

        {/* Renta */}
        <OperationToggle
          title="Renta"
          description="La propiedad está disponible para renta."
          active={v.for_rent}
          onToggle={(checked) => onChange({ for_rent: checked })}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rent_price">Precio de renta</Label>
              <Input
                id="rent_price"
                type="number"
                inputMode="decimal"
                value={v.rent_price}
                onChange={(e) => onChange({ rent_price: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent_currency">Moneda</Label>
              <CurrencySelect
                id="rent_currency"
                value={v.rent_currency}
                onChange={(val) => onChange({ rent_currency: val })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rental_commission_type">Tipo de comisión</Label>
              <Select
                value={v.rental_commission_type}
                onValueChange={(val) =>
                  onChange({ rental_commission_type: val as RentalCommissionType })
                }
              >
                <SelectTrigger id="rental_commission_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RENTAL_COMMISSION_TYPE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {v.rental_commission_type !== "unspecified" && (
              <div className="space-y-2">
                <Label htmlFor="rental_commission_value">Valor de comisión</Label>
                <Input
                  id="rental_commission_value"
                  type="number"
                  inputMode="decimal"
                  value={v.rental_commission_value}
                  onChange={(e) => onChange({ rental_commission_value: e.target.value })}
                  placeholder="0"
                />
              </div>
            )}
          </div>
        </OperationToggle>

        {/* Renta temporal */}
        <OperationToggle
          title="Renta temporal"
          description="La propiedad está disponible para renta vacacional / temporal."
          active={v.for_temporary_rent}
          onToggle={(checked) => onChange({ for_temporary_rent: checked })}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="daily_rate">Tarifa diaria</Label>
              <Input
                id="daily_rate"
                type="number"
                inputMode="decimal"
                value={v.daily_rate}
                onChange={(e) => onChange({ daily_rate: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly_rate">Tarifa semanal</Label>
              <Input
                id="weekly_rate"
                type="number"
                inputMode="decimal"
                value={v.weekly_rate}
                onChange={(e) => onChange({ weekly_rate: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly_rate">Tarifa mensual</Label>
              <Input
                id="monthly_rate"
                type="number"
                inputMode="decimal"
                value={v.monthly_rate}
                onChange={(e) => onChange({ monthly_rate: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimum_stay_nights">Estancia mínima (noches)</Label>
              <Input
                id="minimum_stay_nights"
                type="number"
                value={v.minimum_stay_nights}
                onChange={(e) => onChange({ minimum_stay_nights: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_guests">Huéspedes máximos</Label>
              <Input
                id="max_guests"
                type="number"
                value={v.max_guests}
                onChange={(e) => onChange({ max_guests: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
        </OperationToggle>
      </CardContent>
    </Card>
  );
}
