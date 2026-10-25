import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  MessageCircle,
  MapPin,
  Home,
  Link2,
  X,
  Search,
  Check,
  ChevronsUpDown,
} from "lucide-react";

import { getOwnersByOrg, saveOwner, deleteOwner } from "@/integrations/firebase/services/owners.service";
import { getPropertiesByOrg, saveProperty } from "@/integrations/firebase/services/properties.service";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/_authenticated/crm/duenos")({
  component: OwnersPage,
});

type OwnerProperty = {
  id: string;
  title: string;
  internal_id: string | null;
};

type Owner = {
  id: string;
  name: string;
  whatsapp: string;
  address: string | null;
  created_at: string;
  properties: OwnerProperty[];
};

type OwnerForm = {
  id: string | null;
  name: string;
  whatsapp: string;
  address: string;
};

const EMPTY_FORM: OwnerForm = { id: null, name: "", whatsapp: "", address: "" };

function OwnersPage() {
  const { profile, role } = useAuth();
  const orgId = profile?.organization_id ?? null;
  const isAdmin = role === "tenant_admin" || role === "super_admin";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [form, setForm] = useState<OwnerForm | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [linkOwner, setLinkOwner] = useState<Owner | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [propPickerOpen, setPropPickerOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["crm-owners", orgId],
    enabled: !!orgId && isAdmin,
    queryFn: async () => {
      const [owners, props] = await Promise.all([getOwnersByOrg(orgId!), getPropertiesByOrg(orgId!)]); return owners.map(o => ({ ...o, name: o.full_name || (o as any).name, whatsapp: o.phone || (o as any).whatsapp || "", properties: props.filter(p => p.owner_id === o.id).map(p => ({ id: p.id, title: p.title, internal_id: p.internal_id || "" })) })) as any;
    },
  });

  const { data: availableProperties } = useQuery({
    queryKey: ["crm-available-properties", orgId],
    enabled: !!orgId && isAdmin,
    queryFn: async () => {
      const props = await getPropertiesByOrg(orgId!); return props.filter(p => !p.owner_id).map(p => ({ id: p.id, title: p.title, internal_id: p.internal_id || "" }));
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.whatsapp.toLowerCase().includes(q) ||
        o.properties.some((p) =>
          (p.internal_id ?? "").toLowerCase().includes(q),
        ),
    );
  }, [data, search]);

  const save = useMutation({
    mutationFn: async (f: OwnerForm) => {
      const name = f.name.trim();
      const whatsapp = f.whatsapp.trim();
      if (!name || !whatsapp) throw new Error("Nombre y WhatsApp son obligatorios");
      const payload = {
        name,
        whatsapp,
        address: f.address.trim() || null,
      };
      await saveOwner({ id: f.id, organization_id: orgId!, full_name: name, phone: whatsapp, notes: f.address.trim() || null })
    },
    onSuccess: () => {
      toast.success("Dueño guardado");
      setForm(null);
      queryClient.invalidateQueries({ queryKey: ["crm-owners", orgId] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el dueño"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await deleteOwner(id);
    },
    onSuccess: () => {
      toast.success("Dueño eliminado");
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["crm-owners", orgId] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar el dueño"),
  });

  const linkProperty = useMutation({
    mutationFn: async ({
      ownerId,
      propertyId,
    }: {
      ownerId: string;
      propertyId: string;
    }) => {
      if (!propertyId) throw new Error("Selecciona una propiedad");
      await saveProperty({ id: propertyId, organization_id: orgId!, owner_id: ownerId });
    },
    onSuccess: () => {
      toast.success("Propiedad ligada al dueño");
      setSelectedPropertyId("");
      queryClient.invalidateQueries({ queryKey: ["crm-owners", orgId] });
      queryClient.invalidateQueries({ queryKey: ["crm-available-properties", orgId] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "No se pudo ligar la propiedad"),
  });

  const unlinkProperty = useMutation({
    mutationFn: async (propertyId: string) => {
      await saveProperty({ id: propertyId, organization_id: orgId!, owner_id: null });
    },
    onSuccess: () => {
      toast.success("Propiedad desligada");
      queryClient.invalidateQueries({ queryKey: ["crm-owners", orgId] });
      queryClient.invalidateQueries({ queryKey: ["crm-available-properties", orgId] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "No se pudo desligar la propiedad"),
  });

  // Keep the link dialog content in sync with refreshed query data.
  const activeLinkOwner = linkOwner
    ? data?.find((o) => o.id === linkOwner.id) ?? linkOwner
    : null;

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="Dueños" />
        <p className="text-sm text-muted-foreground">
          No tienes permiso para ver esta sección.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dueños"
        subtitle="Datos de los dueños de las propiedades. Solo visible para administradores."
        action={
          <Button size="sm" onClick={() => setForm({ ...EMPTY_FORM })}>
            <Plus className="h-4 w-4" />
            Nuevo dueño
          </Button>
        }
      />

      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, WhatsApp o ID interno…"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {search
            ? "No se encontraron dueños con esa búsqueda."
            : "Aún no hay dueños registrados."}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const waUrl = buildWhatsAppUrl(o.whatsapp, `Hola ${o.name.split(" ")[0]}`);
            return (
              <Card key={o.id}>
                <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{o.name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {o.whatsapp}
                      </span>
                      {o.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {o.address}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Home className="h-3.5 w-3.5 text-muted-foreground" />
                      {o.properties.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          Sin propiedades ligadas
                        </span>
                      ) : (
                        o.properties.map((p) => (
                          <Badge key={p.id} variant="secondary" className="text-[11px]">
                            {p.internal_id || p.title}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {waUrl && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs"
                      >
                        <a href={waUrl} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => {
                        setLinkOwner(o);
                        setSelectedPropertyId("");
                      }}
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Propiedades
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      aria-label="Editar dueño"
                      onClick={() =>
                        setForm({
                          id: o.id,
                          name: o.name,
                          whatsapp: o.whatsapp,
                          address: o.address ?? "",
                        })
                      }
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 text-destructive"
                      aria-label="Eliminar dueño"
                      onClick={() => setDeleteId(o.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form?.id ? "Editar dueño" : "Nuevo dueño"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="owner-name">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="owner-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="owner-whatsapp">
                  WhatsApp <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="owner-whatsapp"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="Ej. 5215512345678"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="owner-address">Dirección</Label>
                <Input
                  id="owner-address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => form && save.mutate(form)}
              disabled={save.isPending}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link properties dialog */}
      <Dialog open={!!linkOwner} onOpenChange={(o) => !o && setLinkOwner(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Propiedades de {activeLinkOwner?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label>Ligar propiedad</Label>
                <Popover open={propPickerOpen} onOpenChange={setPropPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={propPickerOpen}
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {selectedPropertyId
                          ? (() => {
                              const p = availableProperties?.find(
                                (x) => x.id === selectedPropertyId,
                              );
                              return p
                                ? `${p.title}${p.internal_id ? ` (${p.internal_id})` : ""}`
                                : "Selecciona una propiedad";
                            })()
                          : "Selecciona una propiedad"}
                      </span>
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Buscar propiedad…" />
                      <CommandList>
                        <CommandEmpty>
                          No hay propiedades disponibles sin dueño.
                        </CommandEmpty>
                        <CommandGroup>
                          {availableProperties?.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={`${p.title} ${p.internal_id ?? ""} ${p.id}`}
                              onSelect={() => {
                                setSelectedPropertyId(p.id);
                                setPropPickerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedPropertyId === p.id
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <span className="truncate">
                                {p.title}
                                {p.internal_id && (
                                  <span className="ml-1 text-muted-foreground">
                                    ({p.internal_id})
                                  </span>
                                )}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <Button
                onClick={() =>
                  activeLinkOwner &&
                  linkProperty.mutate({
                    ownerId: activeLinkOwner.id,
                    propertyId: selectedPropertyId,
                  })
                }
                disabled={linkProperty.isPending || !selectedPropertyId}
              >
                Ligar
              </Button>
            </div>


            <div className="space-y-2">
              {!activeLinkOwner || activeLinkOwner.properties.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este dueño aún no tiene propiedades ligadas.
                </p>
              ) : (
                activeLinkOwner.properties.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-foreground">
                        {p.internal_id || "Sin ID"}
                      </span>
                      <span className="ml-2 text-muted-foreground">{p.title}</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 text-destructive"
                      aria-label="Desligar propiedad"
                      onClick={() => unlinkProperty.mutate(p.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este dueño?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Las propiedades ligadas no se
              eliminarán, solo quedarán sin dueño.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && remove.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

