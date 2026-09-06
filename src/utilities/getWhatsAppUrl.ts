/**
 * Builds a `wa.me` deep link from the number stored in Admin -> Footer -> Contact. Falls back to
 * `/contact` so a link never dead-ends if the number hasn't been set yet.
 */
export function getWhatsAppUrl(whatsappNumber?: string | null, message?: string): string {
  const digits = whatsappNumber?.replace(/[^\d]/g, '')
  if (!digits) return '/contact'
  return message ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : `https://wa.me/${digits}`
}
