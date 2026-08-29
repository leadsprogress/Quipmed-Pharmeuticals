import type { HealthHighlightsBlock as HealthHighlightsBlockProps } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { HealthHighlightsClient } from './Component.client'

export const HealthHighlightsBlock: React.FC<
  HealthHighlightsBlockProps & {
    id?: DefaultDocumentIDType
  }
> = ({ heading, cards }) => {
  if (!cards?.length) return null
  return <HealthHighlightsClient heading={heading} cards={cards} />
}
