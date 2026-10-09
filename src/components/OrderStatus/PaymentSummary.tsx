import type { Order } from '@/payload-types'

// Plain-language payment line for the order page, derived from the order's transaction(s).
export function describePayment(transactions: Order['transactions']): {
  label: string
  tone: 'paid' | 'pending' | 'failed'
} | null {
  const transaction = (transactions ?? []).find(
    (t): t is Exclude<typeof t, number | string> => typeof t === 'object' && t !== null,
  )
  if (!transaction) return null

  const method = (transaction as { paymentMethod?: string }).paymentMethod
  const status = (transaction as { status?: string }).status

  if (method === 'cod') {
    return status === 'succeeded'
      ? { label: 'Cash on Delivery — paid', tone: 'paid' }
      : { label: 'Cash on Delivery — pay when delivered', tone: 'pending' }
  }
  if (method === 'upi_manual') {
    return status === 'succeeded'
      ? { label: 'Paid via UPI — verified', tone: 'paid' }
      : { label: 'Paid via UPI — awaiting verification', tone: 'pending' }
  }
  if (status === 'succeeded') return { label: 'Paid online (PayU)', tone: 'paid' }
  if (status === 'failed') return { label: 'Payment failed', tone: 'failed' }
  return { label: 'Payment pending', tone: 'pending' }
}
