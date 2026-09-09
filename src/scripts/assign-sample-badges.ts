// One-off: assigns the "Bestseller"/"New" product-tags to a small, varied sample of real
// products (not all — the user explicitly wants only a handful tagged for now).
import { config as loadEnv } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(dirname, '../../.env') })

const BESTSELLER_TAG_ID = 1
const NEW_TAG_ID = 2

// A handful of real, varied product titles (different categories) — picked by title match
// rather than hardcoded IDs so this stays correct even if IDs differ between environments.
const BESTSELLER_TITLES = ['Atorquip 10', 'Dapagotfil 5', 'Empgotpil 10', 'Rosuquip 10']
const NEW_TITLES = ['Quipvit 4g', 'Sgotpil 50 Mg', 'Trilytin 10', 'Voligside 0.2']

async function main() {
  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayload({ config: configPromise })

  async function assign(titles: string[], tagId: number, label: string) {
    for (const title of titles) {
      const { docs } = await payload.find({
        collection: 'products',
        where: { title: { equals: title } },
        limit: 1,
        overrideAccess: true,
      })
      const product = docs[0]
      if (!product) {
        console.log(`SKIP (not found): ${title}`)
        continue
      }
      const existingTags = (product.tags ?? []).map((t) => (typeof t === 'object' ? t.id : t))
      if (existingTags.includes(tagId)) {
        console.log(`Already tagged "${label}": ${title}`)
        continue
      }
      await payload.update({
        collection: 'products',
        id: product.id,
        data: { tags: [...existingTags, tagId] },
        context: { disableRevalidate: true },
        overrideAccess: true,
      })
      console.log(`Tagged "${label}": ${title} (id ${product.id})`)
    }
  }

  await assign(BESTSELLER_TITLES, BESTSELLER_TAG_ID, 'Bestseller')
  await assign(NEW_TITLES, NEW_TAG_ID, 'New')

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
