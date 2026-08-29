import type { PromoTilesBlock as PromoTilesBlockProps } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { PromoTilesClient } from './Component.client'

export const PromoTilesBlock: React.FC<
  PromoTilesBlockProps & {
    id?: DefaultDocumentIDType
  }
> = ({ tiles }) => {
  if (!tiles?.length) return null
  return <PromoTilesClient tiles={tiles} />
}
