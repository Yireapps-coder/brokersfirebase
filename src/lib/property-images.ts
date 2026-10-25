/**
 * Shared, dependency-free helpers for the property `images` jsonb column.
 *
 * Canonical stored shape (per image):
 *   { full_url, thumb_url, alt, sort_order }
 *
 * Older/looser rows may store plain string URLs or `{ url }` objects; the
 * parser normalizes all of these so every consumer gets the canonical shape.
 * Safe to import from both client and server code (no browser/Node APIs).
 */

export type PropertyImage = {
  full_url: string;
  thumb_url: string;
  alt: string;
  sort_order: number;
};

/** Normalizes the raw jsonb value into a sorted list of canonical images. */
export function parsePropertyImages(images: unknown): PropertyImage[] {
  if (!Array.isArray(images)) return [];

  const parsed = images
    .map((item, index): PropertyImage | null => {
      if (typeof item === "string") {
        return item
          ? { full_url: item, thumb_url: item, alt: "", sort_order: index }
          : null;
      }
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const full =
          (typeof o.full_url === "string" && o.full_url) ||
          (typeof o.url === "string" && o.url) ||
          (typeof o.thumb_url === "string" && o.thumb_url) ||
          "";
        const thumb =
          (typeof o.thumb_url === "string" && o.thumb_url) || full;
        if (!full) return null;
        return {
          full_url: full,
          thumb_url: thumb || full,
          alt: typeof o.alt === "string" ? o.alt : "",
          sort_order:
            typeof o.sort_order === "number" ? o.sort_order : index,
        };
      }
      return null;
    })
    .filter((v): v is PropertyImage => v !== null);

  return parsed.sort((a, b) => a.sort_order - b.sort_order);
}

/** Cover thumbnail (sort_order 0) for card/list views — null when empty. */
export function coverThumbUrl(images: unknown): string | null {
  return parsePropertyImages(images)[0]?.thumb_url ?? null;
}

/** Cover full-size image (sort_order 0) for og:image — null when empty. */
export function coverFullUrl(images: unknown): string | null {
  return parsePropertyImages(images)[0]?.full_url ?? null;
}

/** Full-size URLs in sort order, for the public gallery. */
export function galleryFullUrls(images: unknown): string[] {
  return parsePropertyImages(images).map((i) => i.full_url);
}
