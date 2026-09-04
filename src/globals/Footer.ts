import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
    update: adminOnly,
  },
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Shown in the site footer. Falls back to the default Amulya Medicals logo if left empty.',
      },
    },
    {
      name: 'tagline',
      type: 'textarea',
      defaultValue: 'Genuine, authentic healthcare essentials, delivered reliably across Hyderabad.',
    },
    {
      name: 'quickLinks',
      type: 'array',
      maxRows: 8,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'legalLinks',
      type: 'array',
      maxRows: 8,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      fields: [
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'text' },
        {
          name: 'address',
          type: 'textarea',
          admin: {
            description: 'e.g. "Bhagyanagar Colony, Hyderabad"',
          },
        },
      ],
    },
    {
      name: 'drugLicenseNumber',
      type: 'text',
      admin: {
        description: 'Shown in the footer as "Licensed Pharmacy · Drug License No. ...".',
      },
    },
    {
      name: 'socialLinks',
      type: 'array',
      maxRows: 6,
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'WhatsApp', value: 'whatsapp' },
            { label: 'X (Twitter)', value: 'twitter' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'LinkedIn', value: 'linkedin' },
          ],
        },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'copyrightName',
      type: 'text',
      admin: {
        description: 'Defaults to the site/company name env var if left empty.',
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
  versions: false,
}
