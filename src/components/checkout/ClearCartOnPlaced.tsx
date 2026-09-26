'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

// After a successful order the customer's cart should be empty. PayU returns the customer here
// with ?placed=1 (a full-page redirect, so the cart provider has just re-loaded the old cart
// from storage). Clears it once, then strips the flag so a later add-to-cart on this page
// can't be wiped by mistake.
export const ClearCartOnPlaced: React.FC = () => {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const { cart, clearCart } = useCart()
  const done = useRef(false)
  const placed = searchParams.get('placed') === '1'

  const stripFlag = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('placed')
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }

  useEffect(() => {
    if (!placed || done.current) return
    if (cart?.items && cart.items.length > 0) {
      done.current = true
      void clearCart().finally(stripFlag)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed, cart])

  // No cart ever loaded (e.g. already empty) — still drop the flag after a moment.
  useEffect(() => {
    if (!placed) return
    const timer = setTimeout(() => {
      if (!done.current) {
        done.current = true
        stripFlag()
      }
    }, 5000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed])

  return null
}
