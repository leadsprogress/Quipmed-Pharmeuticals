import type { ValueCardsBlock as ValueCardsBlockProps } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { ValueCards } from '@/components/About/ValueCards'

export const ValueCardsBlockComponent: React.FC<
  ValueCardsBlockProps & {
    id?: DefaultDocumentIDType
  }
> = ({ items }) => {
  return <ValueCards items={items ?? undefined} />
}
