import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  UserCheck,
  MessageCircle,
  CalendarClock,
  Building2,
  Globe,
  ListChecks,
  CheckCircle2,
  Clock,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { getContactsByOrg, saveContact, deleteContact } from "@/integrations/firebase/services/contacts.service";
import { getTeamMembers } from "@/integrations/firebase/services/team.service";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CONTACT_STATUS_LABELS,
  CONTACT_SOURCE_LABELS,
  ACTIVITY_TYPE_LABELS,
  formatDateTime,
} from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/_authenticated/crm/prospectos")({
  component: ContactsPage,
});

const UNASSIGNED = "__unassigned__";

type ContactActivity = {
  id: string;
  type: string;
  description: string | null;
  other_type_description: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
  assignee: { full_name: string | null } | null;
};

function activityLabel(a: ContactActivity): string {
  if (a.type === "otra") return a.other_type_description?.trim() || "Otra";
  return ACTIVITY_TYPE_LABELS[a.type] ?? a.type;
}

function ContactsPage() {
  const { profile, role } = useAuth();
  const orgId = profile?.organization_id ?? null;
  const isAdmin = role === "tenant_admin" || role === "super_admin";
  const queryClient = useQueryClient();

  const [tasksContact, setTasksContact] = useState<{
    name: string;
    activities: ContactActivity[];
  } | null>(null);

  const emptyForm = {
    full_name: "",
    email: "",
    phone: "",
    source: "referido",
    status: "nuevo",
    notes: "",
  };
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const createContact = useMutation({
    mutationFn: async () => {
      if (!form.full_name.trim()) throw new Error("El nombre es obligatorio");
      await saveContact({ organization_id: orgId!, agent_id: isAdmin ? null : (profile?.id ?? null), full_name: form.full_name.trim(), email: form.email.trim() || null, phone: form.phone.trim() || null, source: form.source as any, status: form.status as any, notes: form.notes.trim() || null });
    },
    onSuccess: () => {
      toast.success("Prospecto agregado");
      setCreateOpen(false);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["crm-contacts", orgId] });
      queryClient.invalidateQueries({ queryKey: ["crm-leads", orgId] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "No se pudo agregar el prospecto"),
  });

  const updateContact = useMutation({
    mutationFn: async () => {
      if (!editId) return;
      if (!editForm.full_name.trim()) throw new Error("El nombre es obligatorio");
      await saveContact({ id: editId, organization_id: orgId!, full_name: editForm.full_name.trim(), email: editForm.email.trim() || null, phone: editForm.phone.trim() || null, source: editForm.source as any, status: editForm.status as any, notes: editForm.notes.trim() || null });
    },
    onSuccess: () => {
      toast.success("Prospecto actualizado");
      setEditId(null);
      queryClient.invalidateQueries({ queryKey: ["crm-contacts", orgId] });
      queryClient.invalidateQueries({ queryKey: ["crm-leads", orgId] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar el prospecto"),
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      await deleteContact(id);
    },
    onSuccess: () => {
      toast.success("Prospecto eliminado");
      setEditId(null);
      queryClient.invalidateQueries({ queryKey: ["crm-contacts", orgId] });
      queryClient.invalidateQueries({ queryKey: ["crm-leads", orgId] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar el prospecto"),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["crm-contacts", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      return await getContactsByOrg(orgId!);
    },
  });

  const { data: members } = useQuery({
    queryKey: ["crm-org-members", orgId],
    enabled: !!orgId && isAdmin,
    queryFn: async () => {
      return await getTeamMembers(orgId!);
    },
  });

  const assign = useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string | null }) => {
      await saveContact({ id, organization_id: orgId!, agent_id: agentId });
    },
    onSuccess: () => {
      toast.success("Prospecto asignado");
      queryClient.invalidateQueries({ queryKey: ["crm-contacts", orgId] });
      queryClient.invalidateQueries({ queryKey: ["crm-leads", orgId] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "No se pudo asignar el prospecto"),
  });

  return (
    <div>
      <PageHeader
        title="Prospectos"
        subtitle={
          isAdmin
            ? "Asigna y da seguimiento a los leads de tu equipo."
            : "Da seguimiento a los prospectos que te fueron asignados."
        }
        action={
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Añadir prospecto
          </Button>
        }
      />


      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Aún no hay prospectos registrados."
            : "Aún no tienes prospectos asignados."}
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((c) => {
            const inquiryProperty =
              (
                c.inquiries as
                  | { property: { title: string | null; slug: string } | null }[]
                  | null
              )?.find((i) => i.property)?.property ?? null;
            const activities = ((c.activities as ContactActivity[] | null) ?? [])
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.scheduled_at ?? b.created_at).getTime() -
                  new Date(a.scheduled_at ?? a.created_at).getTime(),
              );
            const pendingCount = activities.filter((a) => !a.completed_at).length;
            const waUrl = buildWhatsAppUrl(
              c.phone,
              `Hola ${c.full_name?.split(" ")[0] ?? ""}, te contacto de la inmobiliaria.`.trim(),
            );
            return (
              <Card key={c.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{c.full_name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {c.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {c.email}
                        </span>
                      )}
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {c.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5" />
                        Asignado a: {c.agent?.full_name ?? "Sin asignar"}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Registrado: {formatDateTime(c.created_at)}
                      </span>
                      {inquiryProperty ? (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          Propiedad: {inquiryProperty.title || inquiryProperty.slug}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3.5 w-3.5" />
                          Origen: {CONTACT_SOURCE_LABELS[c.source] ?? c.source}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() =>
                        setTasksContact({ name: c.full_name ?? "Prospecto", activities })
                      }
                    >
                      <ListChecks className="h-3.5 w-3.5" />
                      Tareas
                      {activities.length > 0 && (
                        <Badge
                          variant={pendingCount > 0 ? "default" : "secondary"}
                          className="ml-0.5 h-4 min-w-4 justify-center px-1 text-[10px]"
                        >
                          {pendingCount > 0 ? pendingCount : activities.length}
                        </Badge>
                      )}
                    </Button>
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
                        setEditForm({
                          full_name: c.full_name ?? "",
                          email: c.email ?? "",
                          phone: c.phone ?? "",
                          source: c.source ?? "referido",
                          status: c.status ?? "nuevo",
                          notes: c.notes ?? "",
                        });
                        setEditId(c.id);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar este prospecto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará el prospecto{" "}
                            {c.full_name ? `"${c.full_name}"` : ""} de forma permanente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteContact.mutate(c.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Etapa:</span>
                      <Badge variant="secondary">{CONTACT_STATUS_LABELS[c.status]}</Badge>
                    </div>
                    {isAdmin && (
                      <Select
                        value={c.agent_id ?? UNASSIGNED}
                        onValueChange={(v) =>
                          assign.mutate({
                            id: c.id,
                            agentId: v === UNASSIGNED ? null : v,
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-[170px] text-xs">
                          <SelectValue placeholder="Asignar a…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNASSIGNED}>Sin asignar</SelectItem>
                          {members?.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.full_name || "Sin nombre"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={!!tasksContact}
        onOpenChange={(o) => !o && setTasksContact(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tareas de {tasksContact?.name}</DialogTitle>
          </DialogHeader>
          {!tasksContact || tasksContact.activities.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              Este prospecto no tiene tareas asignadas todavía.
            </p>
          ) : (
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {tasksContact.activities.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-border p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {activityLabel(a)}
                    </span>
                    {a.completed_at ? (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Completada
                      </Badge>
                    ) : (
                      <Badge className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pendiente
                      </Badge>
                    )}
                  </div>
                  {a.description && (
                    <p className="mt-1 text-muted-foreground">{a.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {a.scheduled_at && (
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Agendada: {formatDateTime(a.scheduled_at)}
                      </span>
                    )}
                    {a.assignee?.full_name && (
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5" />
                        {a.assignee.full_name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir prospecto</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createContact.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="new-name">Nombre completo *</Label>
              <Input
                id="new-name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Nombre del prospecto"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-email">Correo</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-phone">Teléfono</Label>
                <Input
                  id="new-phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="55 1234 5678"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Origen</Label>
                <Select
                  value={form.source}
                  onValueChange={(v) => setForm((f) => ({ ...f, source: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTACT_SOURCE_LABELS).map(([v, label]) => (
                      <SelectItem key={v} value={v}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Etapa</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTACT_STATUS_LABELS).map(([v, label]) => (
                      <SelectItem key={v} value={v}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-notes">Notas</Label>
              <Textarea
                id="new-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Información adicional del prospecto"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createContact.isPending}>
                {createContact.isPending ? "Guardando…" : "Guardar prospecto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editId} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar prospecto</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              updateContact.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre completo *</Label>
              <Input
                id="edit-name"
                value={editForm.full_name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, full_name: e.target.value }))
                }
                placeholder="Nombre del prospecto"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Correo</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="55 1234 5678"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Origen</Label>
                <Select
                  value={editForm.source}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, source: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTACT_SOURCE_LABELS).map(([v, label]) => (
                      <SelectItem key={v} value={v}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Etapa</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTACT_STATUS_LABELS).map(([v, label]) => (
                      <SelectItem key={v} value={v}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Información adicional del prospecto"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditId(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateContact.isPending}>
                {updateContact.isPending ? "Guardando…" : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

}

