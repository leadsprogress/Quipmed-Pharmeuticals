// One-off backfill: fills `compareAtPrice` for every already-existing product that predates the
// field, using the same +15%-rounded-up-to-nearest-₹10 rule as the setCompareAtPrice hook. New
// products get the value automatically via that hook — this script only needs to run once.
import { config as loadEnv } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(dirname, '../../.env') })

function computeCompareAtPrice(priceInINR: number): number {
  const rupees = priceInINR / 100
  const roundedRupees = Math.ceil((rupees * 1.15) / 10) * 10
  return Math.round(roundedRupees * 100)
}

async function main() {
  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default

  const payload = await getPayload({ config: configPromise })

  const { docs: products } = await payload.find({
    collection: 'products',
    where: {
      and: [
        { compareAtPrice: { exists: false } },
        { priceInINR: { greater_than: 0 } },
      ],
    },
    select: { priceInINR: true },
    limit: 0,
    overrideAccess: true,
  })

  console.log(`Found ${products.length} products missing compareAtPrice`)

  let updated = 0
  for (const product of products) {
    if (typeof product.priceInINR !== 'number') continue

    // Supabase's pooled connection occasionally drops mid-run over ~290 sequential updates —
    // retry a few times with a short backoff rather than losing the whole run to one blip.
    let attempt = 0
    for (;;) {
      try {
        await payload.update({
          collection: 'products',
          id: product.id,
          data: { compareAtPrice: computeCompareAtPrice(product.priceInINR) },
          context: { disableRevalidate: true },
          overrideAccess: true,
        })
        break
      } catch (err) {
        attempt++
        if (attempt >= 5) throw err
        console.warn(`Retrying product ${product.id} (attempt ${attempt})`)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      }
    }
    updated++
    if (updated % 25 === 0) console.log(`...${updated}/${products.length}`)
  }

  console.log(`Updated ${updated} products`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
