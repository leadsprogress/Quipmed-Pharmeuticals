import { config as loadEnv } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(dirname, '../../.env') })

const STARTER_TAGS = ['Bestseller', 'New']

async function main() {
  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default

  const payload = await getPayload({ config: configPromise })

  for (const label of STARTER_TAGS) {
    const existing = await payload.find({
      collection: 'product-tags',
      where: { label: { equals: label } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs.length > 0) {
      console.log(`"${label}" already exists, skipping`)
      continue
    }

    await payload.create({
      collection: 'product-tags',
      data: { label },
      context: { disableRevalidate: true },
      overrideAccess: true,
    })
    console.log(`Created "${label}"`)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
