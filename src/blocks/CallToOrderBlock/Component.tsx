import type { CallToOrderBlock as CallToOrderBlockProps } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { getCachedGlobal } from '@/utilities/getGlobals'
import { CallToOrder } from '@/components/Home/CallToOrder'

export const CallToOrderBlockComponent: React.FC<
  CallToOrderBlockProps & {
    id?: DefaultDocumentIDType
  }
> = async ({ label, heading, phoneLabel }) => {
  const footer = await getCachedGlobal('footer', 0)()

  return (
    <CallToOrder
      label={label}
      heading={heading}
      phoneLabel={phoneLabel}
      phone={footer?.contact?.phone}
    />
  )
}
