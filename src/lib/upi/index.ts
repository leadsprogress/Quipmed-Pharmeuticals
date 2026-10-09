// Shared between the checkout UPI panel (client) and the admin approve-payment action (also
// client, via the orders endpoint response) — kept framework-free so both can import it.

export function buildUpiPaymentLink({
  amountInRupees,
  reference,
}: {
  amountInRupees: number
  reference: string
}): string {
  const pa = process.env.NEXT_PUBLIC_UPI_ID || ''
  const pn = process.env.NEXT_PUBLIC_UPI_PAYEE_NAME || 'Amulya Medicals'
  const params = new URLSearchParams({
    pa,
    pn,
    am: amountInRupees.toFixed(2),
    cu: 'INR',
    tr: reference,
  })
  return `upi://pay?${params.toString()}`
}

// A short, human-readable reference the customer can also mention if they message about a
// payment — not a database ID (the order doesn't exist yet when the QR is first shown).
export function generateUpiReference(): string {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `AM-${stamp}${rand}`
}

// wa.me requires digits only, with country code — no "+", spaces, or dashes. Assumes a 10-digit
// Indian mobile number if no country code is present.
export function formatWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  return digits
}

export function buildWhatsAppLink(phone: string, text: string): string {
  return `https://wa.me/${formatWhatsAppNumber(phone)}?text=${encodeURIComponent(text)}`
}
