'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

// PayU sends the customer back to /checkout?payment=failed|error when a payment doesn't complete.
export const PaymentOutcomeToast: React.FC = () => {
  const searchParams = useSearchParams()

  useEffect(() => {
    const outcome = searchParams.get('payment')
    if (outcome === 'failed') {
      toast.error('Your payment was not completed, so you have not been charged. Please try again.')
    } else if (outcome === 'error') {
      toast.error(
        'We could not verify your payment. If money was deducted, please contact us with your details.',
      )
    }
  }, [searchParams])

  return null
}
