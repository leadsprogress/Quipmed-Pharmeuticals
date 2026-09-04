import type { HealthAndVisitBlock as HealthAndVisitBlockProps } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { getCachedGlobal } from '@/utilities/getGlobals'
import { HealthAndVisit } from '@/components/Home/HealthAndVisit'

export const HealthAndVisitBlockComponent: React.FC<
  HealthAndVisitBlockProps & {
    id?: DefaultDocumentIDType
  }
> = async ({ guidesHeading, guides, visitHeading }) => {
  const footer = await getCachedGlobal('footer', 0)()

  const visitAddress = footer?.contact?.address
    ? `Amulya Medicals, ${footer.contact.address}`
    : undefined

  return (
    <HealthAndVisit
      guidesHeading={guidesHeading}
      guides={guides}
      visitHeading={visitHeading}
      visitAddress={visitAddress}
    />
  )
}
