/** Builds a wa.me deep link from a raw WhatsApp number, or null if invalid. */
export function buildWhatsAppUrl(
  number: string | null | undefined,
  message?: string,
): string | null {
  if (!number) return null;
  const digits = number.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
