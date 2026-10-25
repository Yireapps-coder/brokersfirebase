/**
 * Client-side image processing for property uploads.
 *
 * All uploads are downscaled, cropped and converted to modern WebP inside the
 * browser BEFORE reaching storage — saving bandwidth and storage costs.
 */

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export const FULL_MAX_WIDTH = 1920;
export const FULL_MAX_HEIGHT = 1080;
export const FULL_QUALITY = 0.82;

export const THUMB_WIDTH = 640;
export const THUMB_HEIGHT = 360; // 16:9 aspect ratio
export const THUMB_QUALITY = 0.78;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function drawToWebp(
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
  srcX = 0,
  srcY = 0,
  srcW = img.naturalWidth,
  srcH = img.naturalHeight,
  quality = FULL_QUALITY,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(targetW);
  canvas.height = Math.round(targetH);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D canvas context");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetW, targetH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/webp",
      quality,
    );
  });
}

export async function createImageVersions(
  file: File,
): Promise<{ full: Blob; thumb: Blob }> {
  const img = await loadImage(file);
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  // 1. Full-size: downscale preserving aspect ratio if wider than FULL_MAX_WIDTH
  let fullW = w;
  let fullH = h;
  if (w > FULL_MAX_WIDTH || h > FULL_MAX_HEIGHT) {
    const scale = Math.min(FULL_MAX_WIDTH / w, FULL_MAX_HEIGHT / h);
    fullW = w * scale;
    fullH = h * scale;
  }
  const full = await drawToWebp(img, fullW, fullH, 0, 0, w, h, FULL_QUALITY);

  // 2. Thumbnail: center-crop to 16:9 and scale to THUMB_WIDTH x THUMB_HEIGHT
  const targetAspect = 16 / 9;
  const currentAspect = w / h;
  let sx = 0;
  let sy = 0;
  let sw = w;
  let sh = h;

  if (currentAspect > targetAspect) {
    sw = h * targetAspect;
    sh = h;
    sx = (w - sw) / 2;
    sy = 0;
  } else {
    sw = w;
    sh = w / targetAspect;
    sx = 0;
    sy = (h - sh) / 2;
  }
  const thumb = await drawToWebp(img, THUMB_WIDTH, THUMB_HEIGHT, sx, sy, sw, sh);

  return { full, thumb };
}

export function storagePathFromPublicUrl(
  url: string,
  bucket: string,
): string | null {
  if (!url) return null;
  // Firebase Storage URL format
  if (url.includes("firebasestorage.googleapis.com")) {
    const match = url.match(/\/o\/([^?]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
  // Generic fallback
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}
