import type { Field } from 'payload'

// Spread into every block's `fields` array. Checked by RenderBlocks, which wraps the block in
// `hidden md:block` when this is false — the block still renders (and is still editable/visible)
// on tablet/desktop, it's only skipped on phone-width screens.
export const displayOnMobileField: Field = {
  name: 'displayOnMobile',
  type: 'checkbox',
  defaultValue: true,
  admin: {
    position: 'sidebar',
    description: 'Uncheck to hide this entire section on mobile screens. Still shown on tablet/desktop.',
  },
}
