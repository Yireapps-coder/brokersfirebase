import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, Phone, GripVertical, Pencil, Trash2 } from "lucide-react";
import { getContactsByOrg, updateContactStatus, saveContact, deleteContact } from "@/integrations/firebase/services/contacts.service";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_STAGES, CONTACT_SOURCE_LABELS, CONTACT_STATUS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Contact as Lead } from "@/integrations/firebase/types";

export const Route = createFileRoute("/_authenticated/crm/leads")({
  component: LeadsBoardPage,
});



function LeadsBoardPage() {
  const { profile, role } = useAuth();
  const orgId = profile?.organization_id ?? null;
  const isAdmin = role === "tenant_admin" || role === "super_admin";
  const queryClient = useQueryClient();
  const queryKey = ["crm-leads", orgId];

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    source: "referido",
    status: "nuevo",
    notes: "",
  });

  const openEdit = (lead: Lead) => {
    setForm({
      full_name: lead.full_name ?? "",
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      source: lead.source ?? "referido",
      status: lead.status ?? "nuevo",
      notes: lead.notes ?? "",
    });
    setEditLead(lead);
  };

  const { data: leads, isLoading } = useQuery({
    queryKey,
    enabled: !!orgId,
    queryFn: async () => {
      return (await getContactsByOrg(orgId!)) as Lead[];
    },
  });

  const moveLead = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await updateContactStatus(id, status as any);
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Lead[]>(queryKey);
      queryClient.setQueryData<Lead[]>(queryKey, (old) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (old ?? []).map((l) => (l.id === id ? { ...l, status: status as any } : l)),
      );
      return { previous };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
      toast.error("No se pudo mover el lead");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateLead = useMutation({
    mutationFn: async () => {
      if (!editLead) return;
      if (!form.full_name.trim()) throw new Error("El nombre es obligatorio");
      await saveContact({ id: editLead.id, organization_id: orgId!, full_name: form.full_name.trim(), email: form.email.trim() || null, phone: form.phone.trim() || null, source: form.source as any, status: form.status as any, notes: form.notes.trim() || null });
    },
    onSuccess: () => {
      toast.success("Lead actualizado");
      setEditLead(null);
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts", orgId] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar el lead"),
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      await deleteContact(id);
    },
    onSuccess: () => {
      toast.success("Lead eliminado");
      setEditLead(null);
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts", orgId] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar el lead"),
  });

  const handleDrop = (stage: string) => {
    if (draggingId) {
      const lead = leads?.find((l) => l.id === draggingId);
      if (lead && lead.status !== stage) {
        moveLead.mutate({ id: draggingId, status: stage });
      }
    }
    setDraggingId(null);
    setOverStage(null);
  };

  return (
    <div>
      <PageHeader
        title="Embudo de leads"
        subtitle={
          isAdmin
            ? "Arrastra los leads entre etapas para gestionar tu pipeline."
            : "Arrastra tus leads entre etapas para gestionar tu pipeline."
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STAGES.map((stage) => {
            const items = (leads ?? []).filter((l) => l.status === stage.value);
            return (
              <div
                key={stage.value}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverStage(stage.value);
                }}
                onDragLeave={() => setOverStage((s) => (s === stage.value ? null : s))}
                onDrop={() => handleDrop(stage.value)}
                className={cn(
                  "flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/30 p-3 transition-colors",
                  overStage === stage.value && "border-primary bg-primary/5",
                )}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-foreground">{stage.label}</h3>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <div className="flex min-h-[3rem] flex-col gap-2">
                  {items.map((lead) => (
                    <Card
                      key={lead.id}
                      draggable
                      onDragStart={() => setDraggingId(lead.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setOverStage(null);
                      }}
                      className={cn(
                        "cursor-grab active:cursor-grabbing",
                        draggingId === lead.id && "opacity-50",
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {lead.full_name}
                            </p>
                            <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                              {lead.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {lead.phone}
                                </span>
                              )}
                              {lead.email && (
                                <span className="flex items-center gap-1 truncate">
                                  <Mail className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{lead.email}</span>
                                </span>
                              )}
                            </div>
                            {isAdmin && (
                              <p className="mt-1.5 text-[11px] text-muted-foreground">
                                {lead.agent?.full_name ?? "Sin asignar"}
                              </p>
                            )}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0 text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(lead);
                            }}
                            aria-label="Editar lead"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {items.length === 0 && (
                    <p className="px-1 py-4 text-center text-xs text-muted-foreground">
                      Sin leads
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!editLead} onOpenChange={(o) => !o && setEditLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar lead</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              updateLead.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre completo *</Label>
              <Input
                id="edit-name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Nombre del lead"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Correo</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
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
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea
                id="edit-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Información adicional del lead"
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" className="gap-1.5">
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar este lead?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará el lead{" "}
                      {editLead?.full_name ? `"${editLead.full_name}"` : ""} de forma
                      permanente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => editLead && deleteLead.mutate(editLead.id)}
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditLead(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateLead.isPending}>
                  {updateLead.isPending ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


