import type { PromoBannerBlock as PromoBannerBlockProps } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { PromoBanner } from '@/components/Home/PromoBanner'

export const PromoBannerBlockComponent: React.FC<
  PromoBannerBlockProps & {
    id?: DefaultDocumentIDType
  }
> = (props) => {
  return <PromoBanner {...props} />
}
