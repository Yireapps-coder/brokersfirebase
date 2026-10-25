import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth, roleHome } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — Brokers" },
      { name: "description", content: "Accede a tu panel de Brokers." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, role, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Ya autenticado → redirigir al dashboard según rol
  useEffect(() => {
    if (!loading && user) {
      navigate({ to: roleHome(role), replace: true });
    }
  }, [loading, user, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Por favor ingresa tu correo y contraseña.");
      return;
    }
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error("No pudimos iniciar sesión", { description: error });
      setSubmitting(false);
      return;
    }
    toast.success("Bienvenido de vuelta");
    // El useEffect se encarga de la redirección automática al cambiar user/role
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Brokers
            </span>
          </Link>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <h1 className="text-xl font-bold text-foreground">Inicia sesión</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder al CRM inmobiliario.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@agencia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={submitting}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            ¿Problemas para acceder? Contacta al administrador de tu agencia.
          </p>
        </div>
      </div>
    </div>
  );
}
