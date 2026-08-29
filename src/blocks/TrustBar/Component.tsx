import type { TrustBarBlock as TrustBarBlockProps } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { TrustBarClient } from './Component.client'

export const TrustBarBlock: React.FC<
  TrustBarBlockProps & {
    id?: DefaultDocumentIDType
  }
> = ({ items }) => {
  if (!items?.length) return null
  return <TrustBarClient items={items} />
}
