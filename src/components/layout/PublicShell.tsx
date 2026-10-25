import { type ReactNode } from "react";

import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import type { PublicOrg } from "@/lib/api/public.functions";
import {
  orgHeadingsClass,
  orgThemeStyle,
  parseOrgTheme,
} from "@/lib/org-theme";
import { useTenantFavicon } from "@/hooks/use-tenant-favicon";

export function PublicShell({
  org,
  children,
  contained = true,
}: {
  org: PublicOrg | null;
  children: ReactNode;
  contained?: boolean;
}) {
  const theme = parseOrgTheme(org?.theme ?? null);
  useTenantFavicon(org?.logo_url);

  return (
    <div
      className={`flex min-h-screen flex-col bg-background ${orgHeadingsClass(theme)}`}
      style={orgThemeStyle(theme, "public")}
    >
      <PublicHeader org={org} />
      <main className="flex-1">
        {contained ? (
          <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">{children}</div>
        ) : (
          children
        )}
      </main>
      <PublicFooter org={org} />
      <WhatsAppFab number={org?.whatsapp_number} />
    </div>
  );
}
