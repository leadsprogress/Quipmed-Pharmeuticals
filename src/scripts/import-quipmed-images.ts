// Maps QUIPMED ALL PRODUCTS.pdf's 257 full-bleed product photos onto existing Products by name,
// crops each to a uniform 1200x1200 square, and uploads it as the product's gallery[0].image.
//
// Unlike src/endpoints/productImageImporter.ts's per-page Claude Vision bounding-box detection,
// every page here is already a full-bleed product photo with no logo/pricing/text to exclude
// (confirmed by inspection) — so the crop box is just a fixed percentage inset of each page's own
// rendered dimensions, and the only "vision" step needed was reading each page's printed product
// name, which was done manually (Claude Code reading each rendered page directly, same
// no-API-key manual-analysis pattern the importer endpoint already documents) and recorded in
// detected-names.tsv (pageNumber<TAB>detectedName).
import { config as loadEnv } from 'dotenv'
import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(dirname, '../../.env') })

const PAGES_DIR = process.argv[2]
const TSV_PATH = process.argv[3]
const DRY_RUN = process.argv.includes('--dry-run')

// Fraction of page width/height trimmed from each edge before the crop's own auto-trim runs.
const MARGIN_FRACTION = 0.03

async function main() {
  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default
  const { matchProduct, AUTO_MATCH_CONFIDENCE } = await import(
    '../lib/productImageImporter/productMatch'
  )
  const { cropAndOptimize } = await import('../lib/productImageImporter/crop')

  const payload = await getPayload({ config: configPromise })

  const tsv = await fs.readFile(TSV_PATH, 'utf8')
  const rows = tsv
    .trim()
    .split('\n')
    .map((line) => {
      const [pageStr, ...nameParts] = line.split('\t')
      return { page: parseInt(pageStr, 10), name: nameParts.join('\t').trim() }
    })

  const { docs: products } = await payload.find({
    collection: 'products',
    limit: 0,
    depth: 0,
    select: { title: true, slug: true, composition: true, gallery: true },
    overrideAccess: true,
  })

  const candidates = products
    .filter((p): p is typeof p & { title: string } => Boolean(p.title))
    .map((p) => ({ id: p.id, title: p.title, slug: p.slug || '', composition: p.composition }))

  const hasImage = new Map(products.map((p) => [p.id, Boolean(p.gallery?.[0]?.image)]))

  let matched = 0
  let uploaded = 0
  let skippedHasImage = 0
  let needsReview: { page: number; name: string; reason: string }[] = []

  for (const { page, name } of rows) {
    const match = matchProduct({ name }, candidates)

    // Only exact_normalized/slug are trusted unattended here — both require the detected name to
    // already equal (up to normalization) the real title or its slug, so there's no string-
    // similarity math that could paper over an actually-different product. 'fuzzy' (and its
    // composition-boosted variant) proved unsafe for a hands-off bulk run: two real near-misses
    // slipped through at >=0.85 confidence during this same import (a dosage-number swap, and an
    // unrelated product sharing a short suffix code) before this restriction was added — see git
    // history on this file. Fuzzy suggestions are still written to needs-review.json for a human
    // to confirm, just never auto-applied.
    const trustedMethod = match.method === 'exact_normalized' || match.method === 'slug'

    if (!match.product || match.confidence < AUTO_MATCH_CONFIDENCE || !trustedMethod) {
      needsReview.push({
        page,
        name,
        reason: match.product
          ? `${match.method} match (${match.confidence.toFixed(2)}) best guess: ${match.product.title} — not auto-applied`
          : 'no candidate found',
      })
      continue
    }

    matched++

    if (hasImage.get(match.product.id)) {
      skippedHasImage++
      console.log(`[PAGE ${page}] "${name}" -> ${match.product.title} (id ${match.product.id}) — already has image, skipping`)
      continue
    }

    const pagePath = path.join(PAGES_DIR, `page-${String(page).padStart(3, '0')}.png`)
    const pageBuffer = await fs.readFile(pagePath)
    const metadata = await sharp(pageBuffer).metadata()
    const pageWidth = metadata.width!
    const pageHeight = metadata.height!

    const x = Math.round(pageWidth * MARGIN_FRACTION)
    const y = Math.round(pageHeight * MARGIN_FRACTION)
    const box = {
      x,
      y,
      // Derived from the rounded x/y (not rounded independently) so x+width/y+height can never
      // land a pixel past the page edge — sharp's extract() throws hard on that ("bad extract area").
      width: pageWidth - 2 * x,
      height: pageHeight - 2 * y,
    }

    console.log(`[PAGE ${page}] "${name}" -> ${match.product.title} (id ${match.product.id}, confidence ${match.confidence.toFixed(2)}, method ${match.method})`)

    if (DRY_RUN) {
      uploaded++
      continue
    }

    const cropBuffer = await cropAndOptimize(pageBuffer, box)
    const filename = `${match.product.slug || `product-${match.product.id}`}.webp`

    let attempt = 0
    for (;;) {
      try {
        const mediaDoc = await payload.create({
          collection: 'media',
          data: { alt: match.product.title },
          file: { data: cropBuffer, mimetype: 'image/webp', name: filename, size: cropBuffer.length },
          context: { disableRevalidate: true },
          overrideAccess: true,
        })

        await payload.update({
          collection: 'products',
          id: match.product.id,
          data: { gallery: [{ image: mediaDoc.id }] },
          context: { disableRevalidate: true },
          overrideAccess: true,
        })

        hasImage.set(match.product.id, true)
        uploaded++
        break
      } catch (err) {
        attempt++
        if (attempt >= 5) throw err
        console.warn(`[PAGE ${page}] retrying upload (attempt ${attempt}): ${err instanceof Error ? err.message : err}`)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      }
    }
  }

  console.log('\n=== SUMMARY ===')
  console.log(`Total pages: ${rows.length}`)
  console.log(`Matched to a product: ${matched}`)
  console.log(`Uploaded: ${uploaded}`)
  console.log(`Skipped (already had image): ${skippedHasImage}`)
  console.log(`Needs review: ${needsReview.length}`)
  for (const r of needsReview) {
    console.log(`  [PAGE ${r.page}] "${r.name}" — ${r.reason}`)
  }

  await fs.writeFile(
    path.join(path.dirname(TSV_PATH), 'needs-review.json'),
    JSON.stringify(needsReview, null, 2),
  )

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
