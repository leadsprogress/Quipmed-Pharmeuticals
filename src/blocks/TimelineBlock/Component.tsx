import type { TimelineBlock as TimelineBlockProps } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { Timeline } from '@/components/About/Timeline'

export const TimelineBlockComponent: React.FC<
  TimelineBlockProps & {
    id?: DefaultDocumentIDType
  }
> = ({ items }) => {
  return (
    <div className="container max-w-2xl">
      <Timeline items={items ?? undefined} />
    </div>
  )
}
