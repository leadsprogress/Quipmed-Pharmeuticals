import type { WhyChooseUsBlock as WhyChooseUsBlockProps } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { WhyChooseUs } from '@/components/Home/WhyChooseUs'

export const WhyChooseUsBlockComponent: React.FC<
  WhyChooseUsBlockProps & {
    id?: DefaultDocumentIDType
  }
> = ({ heading, rows }) => {
  return <WhyChooseUs heading={heading} rows={rows} />
}
