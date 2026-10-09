'use client'

import { Media } from '@/components/Media'
import { Message } from '@/components/Message'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import { CheckCircle2Icon } from 'lucide-react'

import { useAddresses, useCart, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { CheckoutAddresses } from '@/components/checkout/CheckoutAddresses'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'
import { Address } from '@/payload-types'
import { Checkbox } from '@/components/ui/checkbox'
import { AddressItem } from '@/components/addresses/AddressItem'
import { FormItem } from '@/components/forms/FormItem'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { UpiManualPayment } from '@/components/checkout/UpiManualPayment'

const PAYU_ENABLED = process.env.NEXT_PUBLIC_PAYU_ENABLED === 'true'

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { cart, clearCart } = useCart()
  const [error, setError] = useState<null | string>(null)
  /**
   * State to manage the email input for guest checkout.
   */
  const [email, setEmail] = useState('')
  const [emailEditable, setEmailEditable] = useState(true)
  const { confirmOrder, initiatePayment } = usePayments()
  const { addresses } = useAddresses()
  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>()
  const [billingAddress, setBillingAddress] = useState<Partial<Address>>()
  const [billingAddressSameAsShipping, setBillingAddressSameAsShipping] = useState(true)
  const [isPlacingCodOrder, setIsPlacingCodOrder] = useState(false)
  const [isPlacingUpiOrder, setIsPlacingUpiOrder] = useState(false)
  const [isRedirectingToPayu, setIsRedirectingToPayu] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | 'payu'>('upi')

  const cartIsEmpty = !cart || !cart.items || !cart.items.length

  const canGoToPayment = Boolean(
    (email || user) && billingAddress && (billingAddressSameAsShipping || shippingAddress),
  )

  // On initial load wait for addresses to be loaded and check to see if we can prefill a default one
  useEffect(() => {
    if (!shippingAddress) {
      if (addresses && addresses.length > 0) {
        const defaultAddress = addresses[0]
        if (defaultAddress) {
          setBillingAddress(defaultAddress)
        }
      }
    }
  }, [addresses])

  useEffect(() => {
    return () => {
      setShippingAddress(undefined)
      setBillingAddress(undefined)
      setBillingAddressSameAsShipping(true)
      setEmail('')
      setEmailEditable(true)
    }
  }, [])

  // Cash on Delivery has no external gateway to hand off to — initiate and confirm happen back
  // to back in this one click, instead of the redirect-based PayU flow below.
  const placeCodOrder = useCallback(async () => {
    setIsPlacingCodOrder(true)
    setError(null)
    try {
      const resolvedShippingAddress = billingAddressSameAsShipping ? billingAddress : shippingAddress

      const initiateResult = (await initiatePayment('cod', {
        additionalData: {
          ...(email ? { customerEmail: email } : {}),
          billingAddress,
          shippingAddress: resolvedShippingAddress,
        },
      })) as Record<string, unknown>

      const transactionID = initiateResult?.['transactionID']

      const confirmResult = (await confirmOrder('cod', {
        additionalData: {
          ...(email ? { customerEmail: email } : {}),
          transactionID,
          shippingAddress: resolvedShippingAddress,
        },
      })) as Record<string, unknown>

      if (confirmResult && 'orderID' in confirmResult && confirmResult['orderID']) {
        // The order is placed — empty the cart so the items don't linger in it.
        await clearCart().catch(() => {})
        const accessToken = 'accessToken' in confirmResult ? (confirmResult['accessToken'] as string) : ''
        const queryParams = new URLSearchParams()
        if (email) queryParams.set('email', email)
        if (accessToken) queryParams.set('accessToken', accessToken)
        const queryString = queryParams.toString()
        router.push(`/orders/${confirmResult['orderID']}${queryString ? `?${queryString}` : ''}`)
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred while placing your order.'
      setError(errorMessage)
      toast.error(errorMessage)
      setIsPlacingCodOrder(false)
    }
  }, [billingAddress, billingAddressSameAsShipping, clearCart, confirmOrder, email, initiatePayment, router, shippingAddress])

  // Same back-to-back initiate+confirm shape as COD — the difference is the order comes back
  // with paymentReviewStatus: 'pending' (set server-side), which the order page reads to show a
  // "verifying your payment" banner until staff approve it in the admin.
  const placeUpiOrder = useCallback(
    async (reference: string) => {
      setIsPlacingUpiOrder(true)
      setError(null)
      try {
        const resolvedShippingAddress = billingAddressSameAsShipping ? billingAddress : shippingAddress

        const initiateResult = (await initiatePayment('upi_manual', {
          additionalData: {
            ...(email ? { customerEmail: email } : {}),
            billingAddress,
            reference,
            shippingAddress: resolvedShippingAddress,
          },
        })) as Record<string, unknown>

        const transactionID = initiateResult?.['transactionID']

        const confirmResult = (await confirmOrder('upi_manual', {
          additionalData: {
            ...(email ? { customerEmail: email } : {}),
            transactionID,
            shippingAddress: resolvedShippingAddress,
          },
        })) as Record<string, unknown>

        if (confirmResult && 'orderID' in confirmResult && confirmResult['orderID']) {
          await clearCart().catch(() => {})
          const accessToken = 'accessToken' in confirmResult ? (confirmResult['accessToken'] as string) : ''
          const queryParams = new URLSearchParams()
          if (email) queryParams.set('email', email)
          if (accessToken) queryParams.set('accessToken', accessToken)
          const queryString = queryParams.toString()
          router.push(`/orders/${confirmResult['orderID']}${queryString ? `?${queryString}` : ''}`)
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An error occurred while placing your order.'
        setError(errorMessage)
        toast.error(errorMessage)
        setIsPlacingUpiOrder(false)
      }
    },
    [billingAddress, billingAddressSameAsShipping, clearCart, confirmOrder, email, initiatePayment, router, shippingAddress],
  )

  // PayU is a redirect flow: the server returns a signed set of form fields, and the browser
  // POSTs them to PayU's hosted page. PayU sends the customer back to our callback endpoint,
  // which verifies the result and creates the order.
  const payWithPayu = useCallback(async () => {
    setIsRedirectingToPayu(true)
    setError(null)
    try {
      const result = (await initiatePayment('payu', {
        additionalData: {
          ...(email ? { customerEmail: email } : {}),
          billingAddress,
          shippingAddress: billingAddressSameAsShipping ? billingAddress : shippingAddress,
        },
      })) as { payuParams?: Record<string, string>; payuUrl?: string }

      if (!result?.payuUrl || !result.payuParams) {
        throw new Error('Could not start the payment. Please try again.')
      }

      const form = document.createElement('form')
      form.method = 'POST'
      form.action = result.payuUrl
      Object.entries(result.payuParams).forEach(([name, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = name
        input.value = value
        form.appendChild(input)
      })
      document.body.appendChild(form)
      form.submit()
    } catch (err) {
      let message = 'An error occurred while starting the payment.'
      try {
        const parsed = err instanceof Error ? JSON.parse(err.message) : null
        if (parsed?.cause?.code === 'OutOfStock') message = 'One or more items in your cart are out of stock.'
      } catch {
        if (err instanceof Error && err.message) message = err.message
      }
      setError(message)
      toast.error(message)
      setIsRedirectingToPayu(false)
    }
  }, [billingAddress, billingAddressSameAsShipping, email, initiatePayment, shippingAddress])


  if (cartIsEmpty) {
    return (
      <div className="prose dark:prose-invert py-6 w-full items-center md:py-12">
        <p>Your cart is empty.</p>
        <Link href="/search">Continue shopping?</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-stretch justify-stretch my-8 md:flex-row grow gap-10 md:gap-6 lg:gap-8">
      <div className="basis-full lg:basis-2/3 flex flex-col gap-8 justify-stretch">
        <h2 className="font-medium text-2xl sm:text-3xl">Contact</h2>
        {!user && (
          <div className=" bg-accent dark:bg-black rounded-lg p-4 w-full flex items-center">
            <div className="prose dark:prose-invert">
              <Button asChild className="no-underline text-inherit" variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
              <p className="mt-0">
                <span className="mx-2">or</span>
                <Link href="/create-account">create an account</Link>
              </p>
            </div>
          </div>
        )}
        {user ? (
          <div className="bg-accent dark:bg-card rounded-lg p-4 ">
            <div>
              <p>{user.email}</p>{' '}
              <p>
                Not you?{' '}
                <Link className="underline" href="/logout">
                  Log out
                </Link>
              </p>
            </div>
          </div>
        ) : !emailEditable ? (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2Icon className="size-5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-foreground">Continuing as guest</p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                setEmailEditable(true)
              }}
            >
              Change
            </Button>
          </div>
        ) : (
          <div className="bg-accent dark:bg-black rounded-lg p-4 ">
            <div>
              <p className="mb-4">Enter your email to checkout as a guest.</p>

              <FormItem className="mb-6">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  disabled={!emailEditable}
                  id="email"
                  name="email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                />
              </FormItem>

              <Button
                disabled={!email || !emailEditable}
                onClick={(e) => {
                  e.preventDefault()
                  setEmailEditable(false)
                  toast.success('Continuing as guest')
                }}
                variant="default"
              >
                Continue as guest
              </Button>
            </div>
          </div>
        )}

        <h2 className="font-medium text-2xl sm:text-3xl">Address</h2>

        {billingAddress ? (
          <div>
            <AddressItem
              actions={
                <Button
                  variant={'outline'}
                  onClick={(e) => {
                    e.preventDefault()
                    setBillingAddress(undefined)
                  }}
                >
                  Remove
                </Button>
              }
              address={billingAddress}
            />
          </div>
        ) : user ? (
          <CheckoutAddresses heading="Billing address" setAddress={setBillingAddress} />
        ) : (
          <CreateAddressModal
            disabled={!email || Boolean(emailEditable)}
            callback={(address) => {
              setBillingAddress(address)
            }}
            skipSubmission={true}
          />
        )}

        <div className="flex gap-4 items-center">
          <Checkbox
            id="shippingTheSameAsBilling"
            checked={billingAddressSameAsShipping}
            disabled={!user && (!email || Boolean(emailEditable))}
            onCheckedChange={(state) => {
              setBillingAddressSameAsShipping(state as boolean)
            }}
          />
          <Label htmlFor="shippingTheSameAsBilling">Shipping is the same as billing</Label>
        </div>

        {!billingAddressSameAsShipping && (
          <>
            {shippingAddress ? (
              <div>
                <AddressItem
                  actions={
                    <Button
                      variant={'outline'}
                          onClick={(e) => {
                        e.preventDefault()
                        setShippingAddress(undefined)
                      }}
                    >
                      Remove
                    </Button>
                  }
                  address={shippingAddress}
                />
              </div>
            ) : user ? (
              <CheckoutAddresses
                heading="Shipping address"
                description="Please select a shipping address."
                setAddress={setShippingAddress}
              />
            ) : (
              <CreateAddressModal
                callback={(address) => {
                  setShippingAddress(address)
                }}
                disabled={!email || Boolean(emailEditable)}
                skipSubmission={true}
              />
            )}
          </>
        )}

        <h2 className="font-medium text-2xl sm:text-3xl">Payment</h2>

        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Payment method">
          {PAYU_ENABLED && (
            <Button
              type="button"
              variant={paymentMethod === 'payu' ? 'default' : 'outline'}
              aria-pressed={paymentMethod === 'payu'}
              disabled={isPlacingCodOrder || isPlacingUpiOrder || isRedirectingToPayu}
              onClick={() => setPaymentMethod('payu')}
            >
              Card / Netbanking
            </Button>
          )}
          <Button
            type="button"
            variant={paymentMethod === 'upi' ? 'default' : 'outline'}
            aria-pressed={paymentMethod === 'upi'}
            disabled={isPlacingCodOrder || isPlacingUpiOrder || isRedirectingToPayu}
            onClick={() => setPaymentMethod('upi')}
          >
            Pay via UPI
          </Button>
          <Button
            type="button"
            variant={paymentMethod === 'cod' ? 'default' : 'outline'}
            aria-pressed={paymentMethod === 'cod'}
            disabled={isPlacingCodOrder || isPlacingUpiOrder || isRedirectingToPayu}
            onClick={() => setPaymentMethod('cod')}
          >
            Cash on Delivery
          </Button>
        </div>

        {paymentMethod === 'upi' && (
          <UpiManualPayment
            amountInRupees={(cart?.subtotal ?? 0) / 100}
            disabled={!canGoToPayment}
            isPlacing={isPlacingUpiOrder}
            onPlaceOrder={(reference) => void placeUpiOrder(reference)}
          />
        )}

        {paymentMethod === 'cod' && (
          <Button
            className="self-start"
            disabled={!canGoToPayment || isPlacingCodOrder}
            onClick={(e) => {
              e.preventDefault()
              void placeCodOrder()
            }}
          >
            {isPlacingCodOrder ? 'Placing Order…' : 'Place Order (Cash on Delivery)'}
          </Button>
        )}

        {paymentMethod === 'payu' && PAYU_ENABLED && (
          <Button
            className="self-start"
            disabled={!canGoToPayment || isRedirectingToPayu}
            onClick={(e) => {
              e.preventDefault()
              void payWithPayu()
            }}
          >
            {isRedirectingToPayu ? 'Redirecting to PayU…' : 'Pay Online (UPI / Card / Netbanking)'}
          </Button>
        )}

        {error && (
          <div className="my-8">
            <Message error={error} />

            <Button
              onClick={(e) => {
                e.preventDefault()
                router.refresh()
              }}
              variant="default"
            >
              Try again
            </Button>
          </div>
        )}
      </div>

      {!cartIsEmpty && (
        <div className="basis-full lg:basis-1/3 lg:pl-8 p-8 border-none bg-primary/5 flex flex-col gap-8 rounded-lg">
          <h2 className="text-2xl font-medium sm:text-3xl">Your cart</h2>
          {cart?.items?.map((item, index) => {
            if (typeof item.product === 'object' && item.product) {
              const {
                product,
                product: { id, meta, title, gallery },
                quantity,
                variant,
              } = item

              if (!quantity) return null

              let image = gallery?.[0]?.image || meta?.image
              let price = product?.priceInINR

              const isVariant = Boolean(variant) && typeof variant === 'object'

              if (isVariant) {
                price = variant?.priceInINR

                const imageVariant = product.gallery?.find((item: any) => {
                  if (!item.variantOption) return false
                  const variantOptionID =
                    typeof item.variantOption === 'object'
                      ? item.variantOption.id
                      : item.variantOption

                  const hasMatch = variant?.options?.some((option: any) => {
                    if (typeof option === 'object') return option.id === variantOptionID
                    else return option === variantOptionID
                  })

                  return hasMatch
                })

                if (imageVariant && typeof imageVariant.image !== 'string') {
                  image = imageVariant.image
                }
              }

              return (
                <div className="flex items-start gap-4" key={index}>
                  <div className="flex items-stretch justify-stretch h-20 w-20 rounded-lg border bg-muted p-2">
                    <div className="relative flex w-full h-full items-center justify-center text-muted-foreground">
                      {image && typeof image !== 'string' ? (
                        <Media className="" fill imgClassName="rounded-lg" resource={image} />
                      ) : (
                        <i className="fa-solid fa-capsules text-lg" />
                      )}
                    </div>
                  </div>
                  <div className="flex grow justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-lg">{title}</p>
                      {variant && typeof variant === 'object' && (
                        <p className="text-sm font-mono text-muted-foreground tracking-widest">
                          {variant.options
                            ?.map((option: any) => {
                              if (typeof option === 'object') return option.label
                              return null
                            })
                            .join(', ')}
                        </p>
                      )}
                      <div>
                        {'x'}
                        {quantity}
                      </div>
                    </div>

                    {typeof price === 'number' && <Price amount={price} />}
                  </div>
                </div>
              )
            }
            return null
          })}
          <hr />
          <div className="flex justify-between items-center gap-2">
            <span className="uppercase">Total</span>{' '}
            <Price className="text-2xl font-medium sm:text-3xl" amount={cart.subtotal || 0} />
          </div>
        </div>
      )}
    </div>
  )
}
