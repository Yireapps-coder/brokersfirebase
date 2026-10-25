import { Font } from "@react-pdf/renderer";

import { parseOrgTheme } from "@/lib/org-theme";

/**
 * Resolved palette + font families for the property brochure PDF.
 *
 * Single source of truth = `organizations.theme` (the same jsonb the portal
 * and CRM CSS variables read). When the tenant has no theme — or an incomplete
 * one — we fall back to the platform default brand palette so the document
 * never renders "broken" or unstyled.
 *
 * Colors must be hex (react-pdf does not understand the oklch tokens used in
 * styles.css), so the defaults below are the hex equivalents of the default
 * brand tokens (deep blue / amber).
 */
export type BrochurePalette = {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  textSecondary: string;
  /** Font family used for headings (serif tenants vs sans default). */
  heading: string;
  /** Font family used for body copy (always a readable sans). */
  body: string;
};

const DEFAULTS = {
  primary: "#1B4F8A",
  accent: "#F59E0B",
  background: "#FFFFFF",
  surface: "#F4F6F8",
  textSecondary: "#52607A",
};

let serifRegistered = false;

/** Registers Playfair Display once, lazily, for serif tenants. */
function registerSerif() {
  if (serifRegistered) return;
  serifRegistered = true;
  Font.register({
    family: "Playfair Display",
    fonts: [
      {
        src: "https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-400-normal.ttf",
        fontWeight: 400,
      },
      {
        src: "https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-700-normal.ttf",
        fontWeight: 700,
      },
    ],
  });
}

/** Builds the brochure palette from a raw `organizations.theme` jsonb value. */
export function resolveBrochurePalette(rawTheme: unknown): BrochurePalette {
  const theme = parseOrgTheme(rawTheme);
  const serif = theme?.heading_font === "serif";
  if (serif) registerSerif();

  return {
    primary: theme?.color_primary ?? DEFAULTS.primary,
    accent: theme?.color_accent ?? DEFAULTS.accent,
    background: theme?.color_background ?? DEFAULTS.background,
    surface: theme?.color_surface ?? DEFAULTS.surface,
    textSecondary: theme?.color_text_secondary ?? DEFAULTS.textSecondary,
    heading: serif ? "Playfair Display" : "Helvetica",
    body: "Helvetica",
  };
}
