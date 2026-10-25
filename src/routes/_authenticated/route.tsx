import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { auth } from "@/integrations/firebase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    // Espera inicialización de auth si todavía no está listo
    await new Promise((resolve) => {
      const unsub = auth.onAuthStateChanged((user) => {
        unsub();
        resolve(user);
      });
    });
    if (!auth.currentUser) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => <Outlet />,
});
