'use client'

import QRCode from 'qrcode'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { buildUpiPaymentLink, buildWhatsAppLink, generateUpiReference } from '@/lib/upi'

type Props = {
  amountInRupees: number
  disabled: boolean
  isPlacing: boolean
  onPlaceOrder: (reference: string) => void
}

const UPI_APPS = [
  { label: 'Any UPI App', hint: 'Lets your phone pick' },
  { label: 'Google Pay' },
  { label: 'PhonePe' },
  { label: 'Paytm' },
]

export const UpiManualPayment: React.FC<Props> = ({
  amountInRupees,
  disabled,
  isPlacing,
  onPlaceOrder,
}) => {
  // One reference per mount — re-used for the QR, the app-link buttons, and the order itself once
  // placed, so it's the same number the customer can quote if they message about it.
  const reference = useMemo(() => generateUpiReference(), [])
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const upiLink = useMemo(
    () => buildUpiPaymentLink({ amountInRupees, reference }),
    [amountInRupees, reference],
  )

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(upiLink, { margin: 1, width: 220 }).then((url) => {
      if (!cancelled) setQrDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [upiLink])

  const whatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  const shareLink = buildWhatsAppLink(
    whatsAppNumber,
    `Hi, I just paid ₹${amountInRupees.toFixed(2)} for my order (ref: ${reference}). Sharing the payment screenshot below.`,
  )

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex h-[236px] w-[236px] shrink-0 items-center justify-center rounded-lg border border-border bg-background">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="UPI payment QR code" width={220} height={220} />
          ) : (
            <span className="text-sm text-muted-foreground">Generating QR…</span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Scan to pay</p>
            <p className="text-2xl font-semibold text-foreground">₹{amountInRupees.toFixed(2)}</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              UPI ID: {process.env.NEXT_PUBLIC_UPI_ID}
            </p>
            <p className="text-xs text-muted-foreground">Reference: {reference}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {UPI_APPS.map((app) => (
              <Button key={app.label} asChild variant="outline" size="sm">
                <a href={upiLink}>{app.label}</a>
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            On a phone, these open your UPI app directly. On a computer, scan the QR with your
            phone instead.
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-primary/10 p-4">
        <p className="font-medium text-foreground">
          After paying, please screenshot the payment confirmation and send it to us on WhatsApp.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll verify it and confirm your order — you&apos;ll see the status update here
          once we do.
        </p>
        <Button asChild className="mt-3" variant="outline">
          <a href={shareLink} target="_blank" rel="noopener noreferrer">
            Open WhatsApp to send screenshot
          </a>
        </Button>
      </div>

      <Button disabled={disabled || isPlacing} onClick={() => onPlaceOrder(reference)}>
        {isPlacing ? 'Placing Order…' : "I've Paid — Place Order"}
      </Button>
    </div>
  )
}
