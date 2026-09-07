import type { Block } from 'payload'
import { displayOnMobileField } from '@/fields/displayOnMobile'

// No fields — contact details are pulled from the Footer global (Admin → Footer → Contact) at
// render time, so there's a single source of truth for the site's phone/email/address.
export const ContactBlock: Block = {
  slug: 'contactInfo',
  interfaceName: 'ContactBlockType',
  fields: [displayOnMobileField],
  labels: {
    plural: 'Contact Info + Form Sections',
    singular: 'Contact Info + Form',
  },
}
