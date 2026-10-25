import { useEffect } from "react";

/**
 * Sets the browser tab favicon to the tenant's logo URL.
 * Falls back to the default /favicon.ico when no logo is provided.
 * Runs client-side only; restores the previous icon on unmount.
 */
export function useTenantFavicon(logoUrl: string | null | undefined) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const href = logoUrl && logoUrl.trim() ? logoUrl : "/favicon.ico";

    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const previous = link?.getAttribute("href") ?? null;

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.setAttribute("href", href);

    return () => {
      if (link && previous != null) {
        link.setAttribute("href", previous);
      }
    };
  }, [logoUrl]);
}
