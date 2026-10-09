'use client'

import { Button } from '@/components/ui/button'
import { CopyIcon, CheckIcon } from 'lucide-react'
import React, { useState } from 'react'

type Props = {
  orderId: number | string
  accessToken: string
}

export const TrackingLinkBox: React.FC<Props> = ({ orderId, accessToken }) => {
  const [copied, setCopied] = useState(false)

  const trackingUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/orders/${orderId}?accessToken=${accessToken}`
      : `/orders/${orderId}?accessToken=${accessToken}`

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can fail silently (permissions, non-secure context) — the link is
      // still visible and selectable, so copying by hand remains an option.
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-border bg-muted/40 p-6">
      <p className="font-medium text-foreground">Save your tracking link</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Bookmark this link or copy it somewhere safe — it&apos;s the only way to check this
        order&apos;s status later without an account.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="flex-1 overflow-x-auto rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground">
          {trackingUrl}
        </code>
        <Button type="button" variant="outline" size="sm" onClick={onCopy} className="shrink-0">
          {copied ? (
            <>
              <CheckIcon className="size-4" /> Copied
            </>
          ) : (
            <>
              <CopyIcon className="size-4" /> Copy link
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
