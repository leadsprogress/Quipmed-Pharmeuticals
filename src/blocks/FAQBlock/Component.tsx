import type { FAQBlock as FAQBlockProps } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { Accordion } from '@/components/FAQ/Accordion'

export const FAQBlockComponent: React.FC<
  FAQBlockProps & {
    id?: DefaultDocumentIDType
  }
> = ({ items }) => {
  return (
    <div className="container max-w-2xl">
      <Accordion items={items?.map((i) => ({ question: i.question, answer: i.answer })) ?? []} />
    </div>
  )
}
