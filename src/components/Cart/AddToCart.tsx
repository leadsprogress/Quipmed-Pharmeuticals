'use client'

import { Button } from '@/components/ui/button'
import type { Product, Variant } from '@/payload-types'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import clsx from 'clsx'
import { ShoppingCart, Zap } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
type Props = {
  product: Product
  compact?: boolean
}

export function AddToCart({ product, compact = false }: Props) {
  const { addItem, cart, isLoading } = useCart()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isBuyingNow, setIsBuyingNow] = useState(false)

  const variants = product.variants?.docs || []

  const selectedVariant = useMemo<Variant | undefined>(() => {
    if (product.enableVariants && variants.length) {
      const variantId = searchParams.get('variant')

      const validVariant = variants.find((variant) => {
        if (typeof variant === 'object') {
          return String(variant.id) === variantId
        }
        return String(variant) === variantId
      })

      if (validVariant && typeof validVariant === 'object') {
        return validVariant
      }
    }

    return undefined
  }, [product.enableVariants, searchParams, variants])

  const addToCart = useCallback(
    (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault()

      addItem({
        product: product.id,
        variant: selectedVariant?.id ?? undefined,
      }).then(() => {
        toast.success('Item added to cart.')
      })
    },
    [addItem, product, selectedVariant],
  )

  const buyNow = useCallback(
    (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault()
      setIsBuyingNow(true)

      addItem({
        product: product.id,
        variant: selectedVariant?.id ?? undefined,
      })
        .then(() => {
          router.push('/checkout')
        })
        .finally(() => {
          setIsBuyingNow(false)
        })
    },
    [addItem, product, selectedVariant, router],
  )

  const disabled = useMemo<boolean>(() => {
    const existingItem = cart?.items?.find((item) => {
      const productID = typeof item.product === 'object' ? item.product?.id : item.product
      const variantID = item.variant
        ? typeof item.variant === 'object'
          ? item.variant?.id
          : item.variant
        : undefined

      if (productID === product.id) {
        if (product.enableVariants) {
          return variantID === selectedVariant?.id
        }
        return true
      }
    })

    if (existingItem) {
      const existingQuantity = existingItem.quantity

      if (product.enableVariants) {
        return existingQuantity >= (selectedVariant?.inventory || 0)
      }
      return existingQuantity >= (product.inventory || 0)
    }

    if (product.enableVariants) {
      if (!selectedVariant) {
        return true
      }

      if (selectedVariant.inventory === 0) {
        return true
      }
    } else {
      if (product.inventory === 0) {
        return true
      }
    }

    return false
  }, [selectedVariant, cart?.items, product])

  return (
    <div className="flex items-center gap-2">
      <Button
        aria-label="Add to cart"
        variant={'outline'}
        size={compact ? 'sm' : 'default'}
        className={clsx('gap-2', {
          'hover:opacity-90': true,
        })}
        disabled={disabled || isLoading}
        onClick={addToCart}
        type="submit"
      >
        <ShoppingCart className="size-4" />
        <span className={compact ? 'hidden sm:inline' : undefined}>Add To Cart</span>
      </Button>
      <Button
        aria-label="Buy now"
        variant={'default'}
        size={compact ? 'sm' : 'default'}
        className="gap-2 hover:opacity-90"
        disabled={disabled || isLoading || isBuyingNow}
        onClick={buyNow}
        type="submit"
      >
        <Zap className="size-4" />
        <span className={compact ? 'hidden sm:inline' : undefined}>Buy Now</span>
      </Button>
    </div>
  )
}
