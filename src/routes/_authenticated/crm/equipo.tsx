import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, Pencil, UserPlus, Mail } from "lucide-react";
import { toast } from "sonner";

import { useAuth, type AppRole } from "@/hooks/use-auth";
import {
  getTeamMembers,
  createTeamMember,
  updateMemberRole,
  updateMemberStatus,
  sendMemberPasswordReset,
} from "@/integrations/firebase/services/team.service";
import type { Profile } from "@/integrations/firebase/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

export const Route = createFileRoute("/_authenticated/crm/equipo")({
  component: TeamPage,
});

const ROLE_OPTIONS: { value: "tenant_admin" | "agent"; label: string }[] = [
  { value: "tenant_admin", label: "Admin" },
  { value: "agent", label: "Asesor Inmobiliario" },
];

function roleLabel(role: string): string {
  if (role === "super_admin") return "Super Admin";
  if (role === "tenant_admin") return "Admin";
  return "Asesor Inmobiliario";
}

function canManageTeam(role: AppRole | null): boolean {
  return role === "super_admin" || role === "tenant_admin";
}

function TeamPage() {
  const { role, profile, organization } = useAuth();
  const orgId = profile?.organization_id;
  const queryClient = useQueryClient();
  const isManager = canManageTeam(role);

  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<Profile | null>(null);
  const [editTarget, setEditTarget] = useState<Profile | null>(null);

  // Formulario nuevo usuario
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "agent" as "tenant_admin" | "agent",
  });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["crm-team", orgId],
    enabled: isManager && !!orgId,
    queryFn: () => getTeamMembers(orgId!),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No hay agencia activa");
      if (!form.fullName.trim()) throw new Error("El nombre es requerido");
      if (!form.email.trim()) throw new Error("El correo es requerido");
      if (form.password && form.password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres");
      }

      await createTeamMember({
        organizationId: orgId,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password.trim() || undefined,
        role: form.role,
      });
    },
    onSuccess: () => {
      toast.success("Nuevo integrante agregado al equipo");
      setCreateOpen(false);
      setForm({ fullName: "", email: "", phone: "", password: "", role: "agent" });
      queryClient.invalidateQueries({ queryKey: ["crm-team", orgId] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "No se pudo crear el usuario");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      await sendMemberPasswordReset(email);
    },
    onSuccess: () => {
      toast.success("Enlace de restablecimiento enviado por correo");
      setResetTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Error al enviar enlace");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      await updateMemberRole(userId, role);
    },
    onSuccess: () => {
      toast.success("Rol actualizado");
      setEditTarget(null);
      queryClient.invalidateQueries({ queryKey: ["crm-team", orgId] });
    },
  });

  if (!isManager) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No tienes permisos para administrar el equipo de esta agencia.
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Equipo"
        subtitle={`Integrantes de ${organization?.name || "tu agencia"}.`}
        action={
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo usuario
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No hay más integrantes registrados en el equipo.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {m.full_name?.slice(0, 2).toUpperCase() || "US"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-foreground">{m.full_name}</h4>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                  <Badge variant={m.role === "tenant_admin" ? "default" : "secondary"}>
                    {roleLabel(m.role)}
                  </Badge>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>{m.phone || "Sin teléfono"}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Enviar reset de contraseña"
                      onClick={() => setResetTarget(m)}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Cambiar rol"
                      onClick={() => setEditTarget(m)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal crear miembro */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo integrante</DialogTitle>
            <DialogDescription>
              Registra un nuevo asesor o administrador en tu agencia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="memberName">Nombre completo</Label>
              <Input
                id="memberName"
                placeholder="Ej. Roberto Sánchez"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberEmail">Correo electrónico</Label>
              <Input
                id="memberEmail"
                type="email"
                placeholder="roberto@agencia.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberPhone">Teléfono / WhatsApp (opcional)</Label>
              <Input
                id="memberPhone"
                placeholder="Ej. 222 123 4567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberPass">Contraseña temporal (opcional)</Label>
              <Input
                id="memberPass"
                type="password"
                placeholder="Al menos 6 caracteres (o auto-generada)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Rol en la agencia</Label>
              <Select
                value={form.role}
                onValueChange={(val: "tenant_admin" | "agent") =>
                  setForm({ ...form, role: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Guardar integrante"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal reset de contraseña */}
      <Dialog open={resetTarget !== null} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restablecer contraseña</DialogTitle>
            <DialogDescription>
              Se enviará un correo a <strong>{resetTarget?.email}</strong> con un enlace
              oficial de Firebase para que el usuario ingrese su nueva contraseña.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (resetTarget?.email) resetPasswordMutation.mutate(resetTarget.email);
              }}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar correo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal editar rol */}
      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar rol de {editTarget?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label className="mb-2 block">Rol asignado</Label>
            <Select
              defaultValue={editTarget?.role as any}
              onValueChange={(val: AppRole) => {
                if (editTarget) {
                  updateRoleMutation.mutate({ userId: editTarget.id, role: val });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
