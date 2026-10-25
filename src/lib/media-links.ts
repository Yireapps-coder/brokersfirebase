/** Public media links (videos / social) attached to a property. */

export type MediaLink = { url: string; title?: string };

/** Safely parse the jsonb `media_links` column into a typed array. */
export function parseMediaLinks(value: unknown): MediaLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return { url: item };
      if (item && typeof item === "object" && "url" in item) {
        const obj = item as Record<string, unknown>;
        return {
          url: typeof obj.url === "string" ? obj.url : "",
          title: typeof obj.title === "string" ? obj.title : undefined,
        };
      }
      return { url: "" };
    })
    .filter((l) => l.url.trim() !== "");
}

const YT_RE =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/i;
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/i;

/** Returns an embeddable iframe URL for YouTube/Vimeo, or null for other links. */
export function getEmbedUrl(url: string): string | null {
  const yt = url.match(YT_RE);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(VIMEO_RE);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

/** Human label for the platform behind a link (for non-embeddable links). */
export function mediaPlatformLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (/youtube|youtu\.be/.test(host)) return "YouTube";
    if (/vimeo/.test(host)) return "Vimeo";
    if (/facebook|fb\.watch/.test(host)) return "Facebook";
    if (/instagram/.test(host)) return "Instagram";
    if (/tiktok/.test(host)) return "TikTok";
    if (/twitter|x\.com/.test(host)) return "X";
    if (/youtube/.test(host)) return "YouTube";
    return host;
  } catch {
    return "Enlace";
  }
}
