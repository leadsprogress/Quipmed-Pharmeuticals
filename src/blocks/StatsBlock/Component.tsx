import type { StatsBlock as StatsBlockProps } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { StatsBar } from '@/components/About/StatsBar'

export const StatsBlockComponent: React.FC<
  StatsBlockProps & {
    id?: DefaultDocumentIDType
  }
> = ({ items }) => {
  return <StatsBar items={items ?? undefined} />
}
