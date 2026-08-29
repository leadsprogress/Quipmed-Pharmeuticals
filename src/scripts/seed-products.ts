/**
 * Parses assets/UPDATED PRICE LIST QUIPMED NEW.xlsx (sibling to this repo) into structured
 * product records, grouped by category. With no DATABASE_URI set (or --dry-run passed) it only
 * writes src/scripts/parsed-products.json for review. With DATABASE_URI set, it upserts
 * Categories + Products into Payload via the Local API.
 *
 * The source sheet is a real-world price list, not a clean export: title/letterhead rows,
 * per-category header rows, and occasional dirty numeric cells (e.g. "1`35") are all present.
 * Rows are classified by shape rather than by hardcoded row numbers, since both sheets in the
 * workbook use different header conventions.
 */
import { config as loadEnv } from 'dotenv'
import { writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import XLSX from 'xlsx'

const dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(dirname, '../../.env') })
const WORKBOOK_PATH = path.resolve(dirname, '../../../assets/UPDATED PRICE LIST QUIPMED NEW.xlsx')
const OUTPUT_PATH = path.resolve(dirname, 'parsed-products.json')

type ParsedProduct = {
  category: string
  composition: string
  brandName: string
  packing: string
  packType: string
  mrpPerStrip: number | null
  ratePerStrip: number | null
  offer: string
  sourceSheet: string
}

function cleanNumber(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/[^0-9.]/g, '')
  if (!cleaned) return null
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : null
}

function isDataRow(row: unknown[]): boolean {
  const brandName = String(row[1] ?? '').trim()
  const composition = String(row[0] ?? '').trim()
  const mrp = cleanNumber(row[4])
  return Boolean(brandName) && Boolean(composition) && mrp !== null
}

function parseSheet(sheetName: string, rows: unknown[][]): ParsedProduct[] {
  const products: ParsedProduct[] = []
  let currentCategory = sheetName

  for (const row of rows) {
    if (isDataRow(row)) {
      products.push({
        category: currentCategory,
        composition: String(row[0] ?? '').trim(),
        brandName: String(row[1] ?? '').trim(),
        packing: String(row[2] ?? '').trim(),
        packType: String(row[3] ?? '').trim(),
        mrpPerStrip: cleanNumber(row[4]),
        ratePerStrip: cleanNumber(row[5]),
        offer: String(row[6] ?? '').trim(),
        sourceSheet: sheetName,
      })
      continue
    }

    // A section-title row has text in the first cell but no brand name or packing — real
    // product rows always have both. Don't gate this on the price columns: a stray literal 0
    // in the MRP/rate cell of an otherwise-empty header row (seen in the source sheet) must
    // still count as a header, or every product under it silently inherits the previous
    // category instead of getting its own.
    // Any row reaching this point already failed isDataRow (real product rows are handled
    // above), so it's either a category header — sometimes a bare category name, sometimes a
    // category name alongside the sheet's own column-label row ("DIABETIC RANGE | BRAND NAME |
    // PACKING | ..."), or a stray 0 in the MRP cell of an otherwise-empty header — or sheet
    // letterhead/tagline text ("INDIA'S FASTEST GROWING PCD FRANCHISE COMPANY IN INDIA.").
    // Real category names in this sheet are short and never end in punctuation; letterhead
    // lines are long prose sentences. That distinction is what separates the two, not whether
    // other cells in the row happen to hold text.
    const firstCell = String(row[0] ?? '').trim()
    const looksLikeSectionTitle = firstCell.length > 0 && firstCell.length <= 40 && !firstCell.endsWith('.')
    if (looksLikeSectionTitle) {
      currentCategory = firstCell
    }
  }

  return products
}

// Taxonomy decision (see TASKS.md): the 8 therapeutic ranges map 1:1 to Payload `categories`
// docs. "NEW LAUNCHED PRODUCTS IN QUIPMED" isn't a therapeutic range — it becomes its own
// "New Launches" category, Shopify-collection-style, since `Products.categories` is
// `hasMany: true`. A product only gets one category here because the source sheet doesn't
// state a launched product's therapeutic range.
const NEW_LAUNCHES_SOURCE_CATEGORY = 'NEW LAUNCHED PRODUCTS IN QUIPMED'
const NEW_LAUNCHES_CATEGORY_TITLE = 'New Launches'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function toTitleCase(input: string): string {
  return input
    .toLowerCase()
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ')
}

async function seedIntoPayload(products: ParsedProduct[]) {
  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default

  const payload = await getPayload({ config: configPromise })

  const categoryTitles = new Set<string>()
  for (const p of products) {
    categoryTitles.add(p.category === NEW_LAUNCHES_SOURCE_CATEGORY ? NEW_LAUNCHES_CATEGORY_TITLE : toTitleCase(p.category))
  }

  const categoryIdByTitle = new Map<string, number | string>()
  for (const title of categoryTitles) {
    const slug = slugify(title)
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    if (existing.docs[0]) {
      categoryIdByTitle.set(title, existing.docs[0].id)
      continue
    }
    const created = await payload.create({
      collection: 'categories',
      data: { title },
    })
    categoryIdByTitle.set(title, created.id)
  }
  console.log(`\nEnsured ${categoryIdByTitle.size} categories.`)

  let created = 0
  let skipped = 0
  for (const p of products) {
    if (p.mrpPerStrip === null) {
      skipped += 1
      continue
    }

    const title = toTitleCase(p.brandName)
    const slug = slugify(`${p.brandName}-${p.packing}`)
    const categoryTitle =
      p.category === NEW_LAUNCHES_SOURCE_CATEGORY ? NEW_LAUNCHES_CATEGORY_TITLE : toTitleCase(p.category)
    const categoryId = categoryIdByTitle.get(categoryTitle)

    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs[0]) {
      // The QUIPMED and NEW sheets both list some products — a therapeutic-range row and a
      // "just launched" row for the same drug. Rather than skip the second sighting outright,
      // add its category to the existing product so it picks up both tags (e.g. "Opthalmic"
      // and "New Launches"), matching the hasMany, Shopify-collection-style categories field.
      const existingCategoryIds = (existing.docs[0].categories ?? []).map((c: any) =>
        typeof c === 'object' ? c.id : c,
      )
      if (categoryId && !existingCategoryIds.includes(categoryId)) {
        await payload.update({
          collection: 'products',
          id: existing.docs[0].id,
          data: { categories: [...existingCategoryIds, categoryId] },
        })
      }
      skipped += 1
      continue
    }

    await payload.create({
      collection: 'products',
      data: {
        title,
        slug,
        composition: p.composition,
        packing: p.packing,
        packType: p.packType || undefined,
        categories: categoryId ? [categoryId] : [],
        priceInINREnabled: true,
        priceInINR: Math.round(p.mrpPerStrip * 100),
        inventory: 100,
        _status: 'published',
      } as any,
    })
    created += 1
  }

  console.log(`Created ${created} products, skipped ${skipped} (already existed or missing price).`)
}

async function main() {
  const workbook = XLSX.readFile(WORKBOOK_PATH)
  const allProducts: ParsedProduct[] = []

  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
      header: 1,
      defval: '',
    })
    allProducts.push(...parseSheet(sheetName, rows))
  }

  const byCategory = allProducts.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1
    return acc
  }, {})

  console.log(`Parsed ${allProducts.length} products across ${Object.keys(byCategory).length} categories:`)
  for (const [category, count] of Object.entries(byCategory)) {
    console.log(`  ${category}: ${count}`)
  }

  const flaggedRows = allProducts.filter((p) => p.mrpPerStrip === null || p.ratePerStrip === null)
  if (flaggedRows.length > 0) {
    console.warn(`\n${flaggedRows.length} rows have unparseable price fields — review before seeding:`)
    flaggedRows.forEach((p) => console.warn(`  [${p.category}] ${p.brandName}`))
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(allProducts, null, 2))
  console.log(`\nWrote ${OUTPUT_PATH}`)

  if (!process.env.DATABASE_URI || process.argv.includes('--dry-run')) {
    console.log('\nDry-run only (no DATABASE_URI, or --dry-run passed). Not writing to Payload.')
    return
  }

  const cleanProducts = allProducts.filter((p) => p.mrpPerStrip !== null)
  console.log(`\nDATABASE_URI is set — seeding ${cleanProducts.length} products into Payload...`)
  await seedIntoPayload(cleanProducts)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
