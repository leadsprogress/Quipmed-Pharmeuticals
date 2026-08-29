import { config as loadEnv } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(dirname, '../../.env') })

async function main() {
  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayload({ config: configPromise })

  const products = await payload.delete({ collection: 'products', where: { id: { exists: true } } })
  console.log(`Deleted ${products.docs.length} products`)

  const categories = await payload.delete({ collection: 'categories', where: { id: { exists: true } } })
  console.log(`Deleted ${categories.docs.length} categories`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
