import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { PropertyForm } from "@/components/property/PropertyForm";

export const Route = createFileRoute("/_authenticated/crm/propiedades/nueva")({
  component: NewPropertyPage,
});

function NewPropertyPage() {
  return (
    <div>
      <PageHeader
        title="Nueva propiedad"
        subtitle="Registra una propiedad en el inventario."
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/crm/propiedades">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
        }
      />
      <PropertyForm />
    </div>
  );
}
