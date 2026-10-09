'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { useRouter } from 'next/navigation'
import React, { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { lookupOrderByIdAndEmail, lookupOrderByTrackingCode } from './lookupOrder'

type CodeFormData = {
  trackingCode: string
}

type DetailsFormData = {
  email: string
  orderID: string
}

type Props = {
  initialEmail?: string
}

function goToOrder(
  router: ReturnType<typeof useRouter>,
  result: { orderId: number | string; accessToken: string; email: string },
) {
  const params = new URLSearchParams()
  params.set('accessToken', result.accessToken)
  if (result.email) params.set('email', result.email)
  router.push(`/orders/${result.orderId}?${params.toString()}`)
}

export const FindOrderForm: React.FC<Props> = ({ initialEmail }) => {
  const { user } = useAuth()
  const router = useRouter()
  const [method, setMethod] = useState<'code' | 'details'>('code')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const codeForm = useForm<CodeFormData>()
  const detailsForm = useForm<DetailsFormData>({
    defaultValues: { email: initialEmail || user?.email },
  })

  const onSubmitCode = useCallback(
    async (data: CodeFormData) => {
      setIsSubmitting(true)
      setSubmitError(null)
      try {
        const result = await lookupOrderByTrackingCode(data.trackingCode)
        if (!result.success) {
          setSubmitError(result.error)
          return
        }
        goToOrder(router, result)
      } catch {
        setSubmitError('Something went wrong. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [router],
  )

  const onSubmitDetails = useCallback(
    async (data: DetailsFormData) => {
      setIsSubmitting(true)
      setSubmitError(null)
      try {
        const result = await lookupOrderByIdAndEmail(data.orderID, data.email)
        if (!result.success) {
          setSubmitError(result.error)
          return
        }
        goToOrder(router, result)
      } catch {
        setSubmitError('Something went wrong. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [router],
  )

  return (
    <div className="max-w-lg">
      <h1 className="text-xl mb-4">Track my order</h1>
      <div className="prose dark:prose-invert mb-6">
        <p>
          Have the tracking code from your order confirmation? Paste it below. Otherwise, look it
          up with your order number and email.
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <Button
          type="button"
          variant={method === 'code' ? 'default' : 'outline'}
          onClick={() => setMethod('code')}
        >
          I have my tracking code
        </Button>
        <Button
          type="button"
          variant={method === 'details' ? 'default' : 'outline'}
          onClick={() => setMethod('details')}
        >
          I don&apos;t have it
        </Button>
      </div>

      {method === 'code' ? (
        <form
          className="flex flex-col gap-8"
          onSubmit={codeForm.handleSubmit(onSubmitCode)}
        >
          <FormItem>
            <Label htmlFor="trackingCode" className="mb-2">
              Tracking code
            </Label>
            <Input
              id="trackingCode"
              type="text"
              placeholder="e.g. b27e4472-b6ee-4591-8bed-3f91b4f0e968"
              {...codeForm.register('trackingCode', { required: 'Tracking code is required.' })}
            />
            {codeForm.formState.errors.trackingCode && (
              <FormError message={codeForm.formState.errors.trackingCode.message} />
            )}
          </FormItem>
          {submitError && <FormError message={submitError} />}
          <Button type="submit" className="self-start" variant="default" disabled={isSubmitting}>
            {isSubmitting ? 'Looking up…' : 'Track order'}
          </Button>
        </form>
      ) : (
        <form
          className="flex flex-col gap-8"
          onSubmit={detailsForm.handleSubmit(onSubmitDetails)}
        >
          <FormItem>
            <Label htmlFor="orderID" className="mb-2">
              Order number
            </Label>
            <Input
              id="orderID"
              type="text"
              {...detailsForm.register('orderID', { required: 'Order number is required.' })}
            />
            {detailsForm.formState.errors.orderID && (
              <FormError message={detailsForm.formState.errors.orderID.message} />
            )}
          </FormItem>
          <FormItem>
            <Label htmlFor="email" className="mb-2">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              {...detailsForm.register('email', { required: 'Email is required.' })}
            />
            {detailsForm.formState.errors.email && (
              <FormError message={detailsForm.formState.errors.email.message} />
            )}
          </FormItem>
          {submitError && <FormError message={submitError} />}
          <Button type="submit" className="self-start" variant="default" disabled={isSubmitting}>
            {isSubmitting ? 'Looking up…' : 'Track order'}
          </Button>
        </form>
      )}
    </div>
  )
}
