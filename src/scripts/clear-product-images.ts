/**
 * Clears the mock `imageUrl` field on every product so the storefront falls back to the
 * capsule-icon placeholder by default. The field itself stays on the schema — an admin can still
 * paste a URL (or upload a real gallery photo) per product in the CMS and it will display
 * immediately, this just removes the seeded hotlinked stock photos.
 */
import { config as loadEnv } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(dirname, '../../.env') })

async function main() {
  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayload({ config: configPromise })

  let updated = 0
  let page = 1
  const limit = 50

  while (true) {
    const result = await payload.find({ collection: 'products', limit, page, depth: 0 })
    if (result.docs.length === 0) break

    for (const product of result.docs as any[]) {
      if (product.imageUrl) {
        await payload.update({ collection: 'products', id: product.id, data: { imageUrl: null } })
        updated += 1
      }
    }

    if (!result.hasNextPage) break
    page += 1
  }

  console.log(`Cleared imageUrl on ${updated} products.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
