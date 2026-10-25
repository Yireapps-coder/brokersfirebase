import type { CSSProperties } from "react";

/**
 * Per-tenant theme palette. Stored in `organizations.theme` (jsonb).
 * When an org has no theme, the app keeps the default brand palette
 * defined in `src/styles.css` (deep blue / amber).
 */
export type OrgTheme = {
  color_primary: string;
  color_accent: string;
  color_surface: string;
  color_background: string;
  color_text_secondary: string;
  heading_font: "serif" | "sans";
};

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Serif stack used when `heading_font === "serif"`. */
export const SERIF_STACK =
  '"Playfair Display", Georgia, "Times New Roman", serif';

/** Safely parse the raw jsonb value into a theme, or null when absent/invalid. */
export function parseOrgTheme(raw: unknown): OrgTheme | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const get = (k: string) =>
    typeof t[k] === "string" && HEX.test(t[k] as string)
      ? (t[k] as string)
      : null;

  const primary = get("color_primary");
  const accent = get("color_accent");
  const surface = get("color_surface");
  const background = get("color_background");
  const textSecondary = get("color_text_secondary");

  // Require at least primary + accent for a theme to be considered active.
  if (!primary || !accent) return null;

  return {
    color_primary: primary,
    color_accent: accent,
    color_surface: surface ?? background ?? "#ffffff",
    color_background: background ?? surface ?? "#ffffff",
    color_text_secondary: textSecondary ?? "#6B6358",
    heading_font: t.heading_font === "serif" ? "serif" : "sans",
  };
}

type ThemedStyle = CSSProperties & Record<`--${string}`, string>;

/**
 * Build the CSS custom-property overrides for a scope.
 *
 * - `public`: full palette (background, surface, text, primary, accent) plus
 *   serif headings when requested.
 * - `crm`: only primary + accent (and the sidebar derived from them). Body font
 *   stays sans-serif regardless of `heading_font` for table/form readability.
 *
 * Returns an empty object when there is no theme, so the default palette in
 * `styles.css` is used unchanged (no visual regression for the demo org).
 */
export function orgThemeStyle(
  theme: OrgTheme | null,
  scope: "public" | "crm",
): ThemedStyle {
  if (!theme) return {};

  if (scope === "crm") {
    return {
      "--primary": theme.color_primary,
      "--accent": theme.color_accent,
      "--ring": theme.color_primary,
      "--sidebar": theme.color_primary,
      "--sidebar-primary": theme.color_accent,
      "--sidebar-accent": theme.color_accent,
      "--sidebar-accent-foreground": theme.color_primary,
      "--sidebar-ring": theme.color_accent,
    };
  }

  const style: ThemedStyle = {
    "--background": theme.color_background,
    "--card": theme.color_surface,
    "--popover": theme.color_surface,
    "--secondary": theme.color_surface,
    "--muted": theme.color_surface,
    "--muted-foreground": theme.color_text_secondary,
    "--primary": theme.color_primary,
    "--accent": theme.color_accent,
    "--ring": theme.color_primary,
  };
  if (theme.heading_font === "serif") {
    style["--org-heading-font"] = SERIF_STACK;
  }
  return style;
}

/** Class added to the public wrapper so headings render in the theme font. */
export const orgHeadingsClass = (theme: OrgTheme | null): string =>
  theme?.heading_font === "serif" ? "org-headings-serif" : "";
