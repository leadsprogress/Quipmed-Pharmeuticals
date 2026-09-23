// One-off: fills `sku` for every existing product that predates the field — new/edited products
// get this from ensureSku.ts (Products beforeChange hook) going forward. This script only needs
// to run once.
import { config as loadEnv } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(dirname, '../../.env') })

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

function randomCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return `QM-${code}`
}

async function main() {
  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayload({ config: configPromise })

  const { docs: products } = await payload.find({
    collection: 'products',
    where: { sku: { exists: false } },
    select: {},
    limit: 0,
    overrideAccess: true,
  })

  console.log(`Found ${products.length} products missing sku`)

  let updated = 0
  for (const product of products) {
    let sku: string | null = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = randomCode()
      const existing = await payload.find({
        collection: 'products',
        where: { sku: { equals: candidate } },
        limit: 1,
        overrideAccess: true,
      })
      if (existing.docs.length === 0) {
        sku = candidate
        break
      }
    }
    if (!sku) {
      console.warn(`  Could not generate a unique sku for product ${product.id} — skipped.`)
      continue
    }

    let attempt = 0
    let succeeded = false
    for (; attempt < 5; attempt++) {
      try {
        await payload.update({
          collection: 'products',
          id: product.id,
          data: { sku },
          context: { disableRevalidate: true },
          overrideAccess: true,
        })
        succeeded = true
        break
      } catch (err) {
        // A pre-existing data-integrity issue on this product (e.g. a blank required field) fails
        // every retry identically — only network/connection hiccups are worth retrying, so bail
        // after one attempt on a validation-shaped error rather than a fixed backoff loop.
        const isValidationError = err instanceof Error && err.name === 'ValidationError'
        if (isValidationError) {
          console.warn(`  Skipping product ${product.id}: ${err.message}`)
          break
        }
        if (attempt >= 4) {
          console.warn(`  Skipping product ${product.id} after 5 failed attempts: ${err}`)
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
    if (succeeded) updated++
  }

  console.log(`Updated ${updated} products`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
