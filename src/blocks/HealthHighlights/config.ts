import type { Block } from 'payload'

export const HealthHighlights: Block = {
  slug: 'healthHighlights',
  interfaceName: 'HealthHighlightsBlock',
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Health & Wellness Guides',
    },
    {
      name: 'cards',
      type: 'array',
      minRows: 1,
      maxRows: 8,
      defaultValue: [
        {
          title: 'Managing Diabetes Day to Day',
          excerpt: 'Simple habits — diet, monitoring and medication timing — that make a real difference.',
          tag: 'Diabetic Care',
        },
        {
          title: 'Heart Health After 40',
          excerpt: 'What routine screening actually catches, and why consistency beats intensity.',
          tag: 'Cardiac Care',
        },
        {
          title: 'Reading Your Prescription Correctly',
          excerpt: 'Dosage, timing and interaction warnings — a quick guide to what the label means.',
          tag: 'Patient Guide',
        },
        {
          title: 'Joint Pain: When to See a Doctor',
          excerpt: 'Everyday aches versus warning signs that need an orthopedic consult.',
          tag: 'Orthopedic Care',
        },
      ],
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'excerpt', type: 'text' },
        { name: 'tag', type: 'text' },
      ],
    },
  ],
  labels: {
    plural: 'Health Highlights',
    singular: 'Health Highlights',
  },
}
