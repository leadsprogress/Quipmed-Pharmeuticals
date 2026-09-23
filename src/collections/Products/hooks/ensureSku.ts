import type { CollectionBeforeChangeHook } from 'payload'

// No ambiguous-looking characters (0/O, 1/I) so a code is easy to read off a label or type by hand.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6
const MAX_ATTEMPTS = 5

function randomCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return `QM-${code}`
}

// Every product needs a unique SKU. An admin (or a bulk-import row) can set their own; this only
// fills the field in when it's left blank on create — never overwrites one that's already set,
// same "auto-fill only if empty" convention as compareAtPrice/discountPercent in syncPricing.ts.
export const ensureSku: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || data.sku) return data

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = randomCode()
    const existing = await req.payload.find({
      collection: 'products',
      where: { sku: { equals: candidate } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs.length === 0) {
      data.sku = candidate
      return data
    }
  }

  throw new Error('Could not generate a unique SKU after several attempts — please try saving again.')
}
