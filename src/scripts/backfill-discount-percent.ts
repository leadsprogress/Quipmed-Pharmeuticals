// One-off: fills discountPercent for every product that already has a compareAtPrice set (from
// the earlier compare-price backfill) but predates the discountPercent field. New/edited
// products get this from syncPricing.ts going forward — this script only needs to run once.
import { config as loadEnv } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(dirname, '../../.env') })

async function main() {
  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayload({ config: configPromise })

  const { docs: products } = await payload.find({
    collection: 'products',
    where: {
      and: [
        { discountPercent: { exists: false } },
        { compareAtPrice: { exists: true } },
        { priceInINR: { greater_than: 0 } },
      ],
    },
    select: { priceInINR: true, compareAtPrice: true },
    limit: 0,
    overrideAccess: true,
  })

  console.log(`Found ${products.length} products missing discountPercent`)

  let updated = 0
  for (const product of products) {
    if (typeof product.priceInINR !== 'number' || typeof product.compareAtPrice !== 'number') continue
    if (product.compareAtPrice <= product.priceInINR) continue

    const discountPercent = Math.round(
      ((product.compareAtPrice - product.priceInINR) / product.compareAtPrice) * 100,
    )

    let attempt = 0
    for (;;) {
      try {
        await payload.update({
          collection: 'products',
          id: product.id,
          data: { discountPercent },
          context: { disableRevalidate: true },
          overrideAccess: true,
        })
        break
      } catch (err) {
        attempt++
        if (attempt >= 5) throw err
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      }
    }
    updated++
  }

  console.log(`Updated ${updated} products`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
