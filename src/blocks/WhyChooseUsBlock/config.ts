import type { Block } from 'payload'

export const WhyChooseUsBlock: Block = {
  slug: 'whyChooseUs',
  interfaceName: 'WhyChooseUsBlock',
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'rows',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true },
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'icon', type: 'text', admin: { description: 'Font Awesome icon class' } },
      ],
    },
  ],
  labels: {
    plural: 'Why Choose Us Sections',
    singular: 'Why Choose Us Section',
  },
}
