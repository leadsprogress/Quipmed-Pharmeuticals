'use client'

import { FieldLabel, toast, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import React, { useState } from 'react'

import { buildWhatsAppLink } from '@/lib/upi'

type ApproveResponse = {
  ok: boolean
  error?: string
  order?: {
    id: number | string
    amount?: number | null
    items?: string
    customerName?: string
    phone?: string
  }
}

// Sits in place of the plain `paymentReviewStatus` select on manual-UPI orders (see
// plugins/index.ts) — approving isn't just picking a value, it's an action: it marks the order's
// transaction paid server-side (src/endpoints/orders.ts) and opens a pre-filled WhatsApp chat to
// the customer, so a bare dropdown + Save wouldn't give the second part at all.
export const ApproveUpiPayment: React.FC = () => {
  const { id } = useDocumentInfo()
  const status = useFormFields(([fields]) => fields.paymentReviewStatus?.value) as
    | string
    | undefined
  const dispatch = useFormFields(([, dispatchFields]) => dispatchFields)
  const [isApproving, setIsApproving] = useState(false)

  const onApprove = async () => {
    if (!id) return
    setIsApproving(true)
    try {
      const res = await fetch(`/api/order-review/${id}/approve-upi-payment`, {
        method: 'PATCH',
        credentials: 'include',
      })
      const body: ApproveResponse = await res.json()
      if (!res.ok || !body.ok) {
        throw new Error(body.error || 'Could not approve this payment.')
      }

      dispatch({ type: 'UPDATE', path: 'paymentReviewStatus', value: 'approved' })
      toast.success('Payment approved.')

      const order = body.order
      if (order?.phone) {
        const amountText =
          typeof order.amount === 'number' ? `₹${(order.amount / 100).toFixed(2)}` : ''
        const message = [
          'Your order is confirmed! ✅',
          `Order #${order.id}${amountText ? ` — ${amountText}` : ''}`,
          order.items ? `Items: ${order.items}` : null,
          'Thank you for shopping with Amulya Medicals.',
        ]
          .filter(Boolean)
          .join('\n')

        window.open(buildWhatsAppLink(order.phone, message), '_blank')
      } else {
        toast.error('Approved, but this order has no phone number to message on WhatsApp.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not approve this payment.')
    } finally {
      setIsApproving(false)
    }
  }

  return (
    <div>
      <FieldLabel label="Payment review" />
      {status === 'approved' ? (
        <p style={{ color: 'var(--theme-success-500, #1a7f37)', fontWeight: 600 }}>✓ Approved</p>
      ) : (
        <button
          type="button"
          onClick={onApprove}
          disabled={isApproving}
          className="btn btn--style-primary btn--size-small"
        >
          {isApproving ? 'Approving…' : 'Approve Payment & Notify via WhatsApp'}
        </button>
      )}
    </div>
  )
}
