import type { HomeHeroBlock as HomeHeroBlockProps } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { Hero } from '@/components/Home/Hero'

export const HeroBlockComponent: React.FC<
  HomeHeroBlockProps & {
    id?: DefaultDocumentIDType
  }
> = (props) => {
  return <Hero {...props} />
}
