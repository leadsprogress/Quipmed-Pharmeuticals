import { config as loadEnv } from 'dotenv'
import path from 'path'
loadEnv({ path: path.resolve(process.cwd(), '.env') })

async function main() {
  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayload({ config: configPromise })

  const job = await payload.findByID({ collection: 'product-image-imports', id: 3 })
  const pages = (job.pages || []).map((p) =>
    p.pageNumber === 2
      ? { ...p, status: 'COMPLETED' as const, imported: true, uploadedMedia: 14, previousGalleryImage: null, hadGalleryBeforeImport: false }
      : p,
  )
  await payload.update({ collection: 'product-image-imports', id: 3, data: { pages } })
  console.log('done')
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
