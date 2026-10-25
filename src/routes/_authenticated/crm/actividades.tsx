import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  StickyNote,
  CalendarClock,
  Check,
  Plus,
  MoreHorizontal,
  MoreVertical,
  Pencil,
  Trash2,
  User as UserIcon,
  ChevronsUpDown,
  X,
} from "lucide-react";
import { getActivitiesByOrg, saveActivity, updateActivityStatus, deleteActivity as removeActivity } from "@/integrations/firebase/services/activities.service";
import { getTeamMembers } from "@/integrations/firebase/services/team.service";
import { getContactsByOrg } from "@/integrations/firebase/services/contacts.service";
import { getOwnersByOrg } from "@/integrations/firebase/services/owners.service";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ACTIVITY_TYPE_LABELS, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/_authenticated/crm/actividades")({
  component: ActivitiesPage,
});

type ActivityType = "llamada" | "reunion" | "visita" | "seguimiento" | "tarea" | "otro";
type ActivityStatus = "pendiente" | "completada" | "cancelada";

const STATUS_LABELS: Record<ActivityStatus, string> = {
  pendiente: "Pendiente",
  seguimiento: "Seguimiento",
  completada: "Completada",
};

const STATUS_BADGE: Record<ActivityStatus, "secondary" | "default" | "outline"> = {
  pendiente: "secondary",
  seguimiento: "outline",
  completada: "default",
};

const TYPE_ICONS: Record<ActivityType, typeof Phone> = {
  llamada: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  visita: MapPin,
  nota: StickyNote,
  otra: MoreHorizontal,
};

type OrgMember = { id: string; full_name: string | null };

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function activityLabel(type: ActivityType, otherDescription: string | null): string {
  if (type === "otra") return otherDescription?.trim() || "Otra";
  return ACTIVITY_TYPE_LABELS[type] ?? type;
}

/** Searchable dropdown to pick an organization member. */
function UserCombobox({
  members,
  value,
  onChange,
  placeholder = "Selecciona un usuario",
  allowAll = false,
}: {
  members: OrgMember[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  allowAll?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = members.find((m) => m.id === value);
  const label =
    value === "all"
      ? "Todos los usuarios"
      : selected?.full_name || (value ? "Usuario" : placeholder);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            <UserIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{label}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar usuario…" />
          <CommandList>
            <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
            <CommandGroup>
              {allowAll && (
                <CommandItem
                  value="Todos los usuarios"
                  onSelect={() => {
                    onChange("all");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === "all" ? "opacity-100" : "opacity-0")}
                  />
                  Todos los usuarios
                </CommandItem>
              )}
              {members.map((m) => (
                <CommandItem
                  key={m.id}
                  value={`${m.full_name ?? ""} ${m.id}`}
                  onSelect={() => {
                    onChange(m.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === m.id ? "opacity-100" : "opacity-0")}
                  />
                  {m.full_name || "Sin nombre"}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ActivitiesPage() {
  const { profile, role } = useAuth();
  const orgId = profile?.organization_id ?? null;
  const isAdmin = role === "tenant_admin" || role === "super_admin";
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [type, setType] = useState<ActivityType>("llamada");
  const [status, setStatus] = useState<ActivityStatus>("pendiente");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [otherTypeDescription, setOtherTypeDescription] = useState("");
  const [contactId, setContactId] = useState<string>("none");
  const [ownerId, setOwnerId] = useState<string>("none");
  const [scheduledAt, setScheduledAt] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>(profile?.id ?? "");
  const [filterAssigned, setFilterAssigned] = useState<string>("all");
  const [filterOwner, setFilterOwner] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<ActivityStatus | "all">(
    "pendiente",
  );
  const [sortOrder, setSortOrder] = useState<"recientes" | "viejas">("recientes");

  const hasActiveFilters =
    filterAssigned !== "all" ||
    filterOwner !== "all" ||
    filterType !== "all" ||
    filterStatus !== "all" ||
    sortOrder !== "recientes";

  const clearFilters = () => {
    setFilterAssigned("all");
    setFilterOwner("all");
    setFilterType("all");
    setFilterStatus("all");
    setSortOrder("recientes");
  };

  const { data: members } = useQuery({
    queryKey: ["crm-org-members", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const members = await getTeamMembers(orgId!); return members.map(m => ({ id: m.id, full_name: m.full_name })) as OrgMember[];
    },
  });

  const { data: activities, isLoading } = useQuery({
    queryKey: ["crm-activities", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      return (await getActivitiesByOrg(orgId!)) as any;
    },
  });

  const { data: owners } = useQuery({
    queryKey: ["crm-owners-min", orgId],
    enabled: !!orgId && isAdmin,
    queryFn: async () => {
      const o = await getOwnersByOrg(orgId!); return o.map(x => ({ id: x.id, name: x.full_name || (x as any).name }));
    },
  });

  const { data: contacts } = useQuery({
    queryKey: ["crm-contacts-min", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const c = await getContactsByOrg(orgId!); return c.map(x => ({ id: x.id, full_name: x.full_name }));
    },
  });

  const filteredActivities = useMemo(() => {
    if (!activities) return activities;
    let result = activities.filter((a) => {
      if (filterAssigned !== "all" && a.assigned_to !== filterAssigned) return false;
      if (filterOwner !== "all" && a.owner_id !== filterOwner) return false;
      if (filterType !== "all" && a.type !== filterType) return false;
      if (filterStatus !== "all" && (a.status ?? "pendiente") !== filterStatus)
        return false;
      return true;
    });
    result = [...result].sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortOrder === "recientes" ? tb - ta : ta - tb;
    });
    return result;
  }, [activities, filterAssigned, filterOwner, filterType, filterStatus, sortOrder]);

  const resetForm = () => {
    setType("llamada");
    setStatus("pendiente");
    setDescription("");
    setNotes("");
    setOtherTypeDescription("");
    setContactId("none");
    setOwnerId("none");
    setScheduledAt("");
    setAssignedTo(profile?.id ?? "");
  };

  const openCreate = () => {
    setEditingId(null);
    resetForm();
    setOpen(true);
  };

  type ActivityRow = NonNullable<typeof activities>[number];
  const openEdit = (a: ActivityRow) => {
    setDetailId(null);
    setEditingId(a.id);
    setType(a.type);
    setStatus(a.status ?? "pendiente");
    setDescription(a.description ?? "");
    setNotes(a.notes ?? "");
    setOtherTypeDescription(a.other_type_description ?? "");
    setContactId(a.contact_id ?? "none");
    setOwnerId(a.owner_id ?? "none");
    setAssignedTo(a.assigned_to ?? profile?.id ?? "");
    setScheduledAt(
      a.scheduled_at ? new Date(a.scheduled_at).toISOString().slice(0, 16) : "",
    );
    setOpen(true);
  };

  const saveActivity = useMutation({
    mutationFn: async () => {
      if (type === "otra" && !otherTypeDescription.trim()) {
        throw new Error("Especifica el tipo de actividad");
      }
      const existing = editingId
        ? activities?.find((x) => x.id === editingId) ?? null
        : null;
      const now = new Date().toISOString();
      const payload = {
        type,
        status,
        description: description.trim() || null,
        notes: notes.trim() || null,
        other_type_description: type === "otra" ? otherTypeDescription.trim() : null,
        contact_id: contactId === "none" ? null : contactId,
        owner_id: ownerId === "none" ? null : ownerId,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        assigned_to: assignedTo || profile?.id || null,
        followup_at:
          status === "seguimiento"
            ? existing?.followup_at ?? now
            : existing?.followup_at ?? null,
        completed_at:
          status === "completada" ? existing?.completed_at ?? now : null,
      };
      await saveActivity({ id: editingId || undefined, organization_id: orgId!, agent_id: profile?.id ?? null, ...(payload as any) })
    },
    onSuccess: () => {
      toast.success(editingId ? "Actividad actualizada" : "Actividad registrada");
      queryClient.invalidateQueries({ queryKey: ["crm-activities", orgId] });
      setOpen(false);
      setEditingId(null);
      resetForm();
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la actividad");
    },
  });

  const deleteActivity = useMutation({
    mutationFn: async (id: string) => {
      await removeActivity(id);
    },
    onSuccess: () => {
      toast.success("Actividad eliminada");
      queryClient.invalidateQueries({ queryKey: ["crm-activities", orgId] });
      setDeleteId(null);
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar");
    },
  });

  const completeActivity = useMutation({
    mutationFn: async (id: string) => {
      await updateActivityStatus(id, "completada");
    },
    onSuccess: () => {
      toast.success("Actividad completada");
      queryClient.invalidateQueries({ queryKey: ["crm-activities", orgId] });
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar");
    },
  });

  const detailActivity = activities?.find((x) => x.id === detailId) ?? null;
  const detailStatus: ActivityStatus = detailActivity?.status ?? "pendiente";

  return (
    <div>
      <PageHeader
        title="Actividades"
        subtitle="Tu bitácora de llamadas, visitas y notas."
        action={
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) {
                setEditingId(null);
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Nueva actividad
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar actividad" : "Nueva actividad"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={(v) => setType(v as ActivityType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as ActivityStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {type === "otra" && (
                  <div className="space-y-2">
                    <Label htmlFor="other-type">Especifica el tipo de actividad</Label>
                    <Input
                      id="other-type"
                      placeholder="Ej. Entrega de llaves"
                      value={otherTypeDescription}
                      onChange={(e) => setOtherTypeDescription(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Asignar a</Label>
                  <UserCombobox
                    members={members ?? []}
                    value={assignedTo}
                    onChange={setAssignedTo}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prospecto (opcional)</Label>
                  <Select value={contactId} onValueChange={setContactId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin prospecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin prospecto</SelectItem>
                      {contacts?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isAdmin && (
                  <div className="space-y-2">
                    <Label>Dueño del inmueble (opcional)</Label>
                    <Select value={ownerId} onValueChange={setOwnerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin dueño" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin dueño</SelectItem>
                        {owners?.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}



                <div className="space-y-2">
                  <Label htmlFor="scheduled">Agendar para (opcional)</Label>
                  <Input
                    id="scheduled"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Detalles de la actividad…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    placeholder="Notas internas, acuerdos, próximos pasos…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => saveActivity.mutate()}
                  disabled={saveActivity.isPending}
                >
                  {saveActivity.isPending ? "Guardando…" : "Guardar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Filtrar por asignado</Label>
          <UserCombobox
            members={members ?? []}
            value={filterAssigned}
            onChange={setFilterAssigned}
            allowAll
          />
        </div>

        {isAdmin && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Dueño del inmueble</Label>
            <Select value={filterOwner} onValueChange={setFilterOwner}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los dueños</SelectItem>
                {owners?.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Tipo de actividad</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Estado</Label>
          <Select
            value={filterStatus}
            onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Ordenar por</Label>
          <Select
            value={sortOrder}
            onValueChange={(v) => setSortOrder(v as typeof sortOrder)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recientes">Más recientes</SelectItem>
              <SelectItem value="viejas">Más viejas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="w-full"
          >
            <X className="h-4 w-4" />
            Limpiar filtros
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : !filteredActivities || filteredActivities.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {activities && activities.length > 0
            ? "No hay actividades que coincidan con los filtros seleccionados."
            : "Aún no has registrado actividades. Crea la primera con el botón superior."}
        </p>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((a) => {
            const Icon = TYPE_ICONS[a.type] ?? StickyNote;
            const statusValue: ActivityStatus = a.status ?? "pendiente";
            const done = statusValue === "completada";
            const assigneeName = a.assignee?.full_name ?? null;
            return (
              <Card
                key={a.id}
                onClick={() => setDetailId(a.id)}
                className="cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/40"
              >
                <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="flex min-w-0 gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">
                          {activityLabel(a.type, a.other_type_description)}
                        </p>
                        <Badge variant={STATUS_BADGE[statusValue]}>
                          {STATUS_LABELS[statusValue]}
                        </Badge>
                        {a.contact?.full_name && (
                          <Badge variant="secondary">Prospecto: {a.contact.full_name}</Badge>
                        )}
                        {a.property?.title && (
                          <Badge variant="outline" className="max-w-[12rem] truncate">
                            Propiedad: {a.property.title}
                          </Badge>
                        )}
                        {a.owner?.name && (
                          <Badge variant="outline" className="max-w-[12rem] truncate">
                            <UserIcon className="mr-1 h-3 w-3" />
                            Dueño: {a.owner.name}
                          </Badge>
                        )}
                      </div>
                      {a.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {assigneeName && (
                          <span className="flex items-center gap-1.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                              {initials(assigneeName)}
                            </span>
                            Asignado a: {assigneeName}
                          </span>
                        )}
                        {a.scheduled_at && (
                          <span className="flex items-center gap-1">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {formatDateTime(a.scheduled_at)}
                          </span>
                        )}
                        {done && (
                          <span className="flex items-center gap-1 text-primary">
                            <Check className="h-3.5 w-3.5" />
                            Completada {formatDateTime(a.completed_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!done && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          completeActivity.mutate(a.id);
                        }}
                        disabled={completeActivity.isPending}
                      >
                        <Check className="h-4 w-4" />
                        Completar
                      </Button>
                    )}
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Opciones</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(a)}>
                            <Pencil className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteId(a.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Activity detail card */}
      <Dialog
        open={!!detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
      >
        <DialogContent>
          {detailActivity && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  {activityLabel(
                    detailActivity.type,
                    detailActivity.other_type_description,
                  )}
                  <Badge variant={STATUS_BADGE[detailStatus]}>
                    {STATUS_LABELS[detailStatus]}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                {detailActivity.assignee?.full_name && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Asignado a</span>
                    <span className="font-medium text-foreground">
                      {detailActivity.assignee.full_name}
                    </span>
                  </div>
                )}
                {detailActivity.contact?.full_name && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Prospecto</span>
                    <span className="font-medium text-foreground">
                      {detailActivity.contact.full_name}
                    </span>
                  </div>
                )}
                {detailActivity.owner?.name && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Dueño del inmueble</span>
                    <span className="font-medium text-foreground">
                      {detailActivity.owner.name}
                    </span>
                  </div>
                )}
                {detailActivity.property?.title && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Propiedad</span>
                    <span className="font-medium text-foreground">
                      {detailActivity.property.title}
                    </span>
                  </div>
                )}
                {detailActivity.scheduled_at && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Agendada para</span>
                    <span className="font-medium text-foreground">
                      {formatDateTime(detailActivity.scheduled_at)}
                    </span>
                  </div>
                )}

                {detailActivity.description && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Descripción
                    </p>
                    <p className="whitespace-pre-wrap text-foreground">
                      {detailActivity.description}
                    </p>
                  </div>
                )}
                {detailActivity.notes && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Notas</p>
                    <p className="whitespace-pre-wrap text-foreground">
                      {detailActivity.notes}
                    </p>
                  </div>
                )}

                <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between gap-3">
                    <span>Fecha de creación</span>
                    <span>{formatDateTime(detailActivity.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Fecha de seguimiento</span>
                    <span>
                      {detailActivity.followup_at
                        ? formatDateTime(detailActivity.followup_at)
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Fecha de completado</span>
                    <span>
                      {detailActivity.completed_at
                        ? formatDateTime(detailActivity.completed_at)
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeleteId(detailActivity.id);
                    setDetailId(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
                <Button onClick={() => openEdit(detailActivity)}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>


      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar actividad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La actividad se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteActivity.mutate(deleteId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


