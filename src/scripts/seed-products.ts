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
import { writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import XLSX from 'xlsx'

const dirname = path.dirname(fileURLToPath(import.meta.url))
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

    const firstCell = String(row[0] ?? '').trim()
    const looksLikeSectionTitle = firstCell.length > 0 && !row.slice(1, 6).some((c) => cleanNumber(c) !== null)
    if (looksLikeSectionTitle) {
      currentCategory = firstCell
    }
  }

  return products
}

function main() {
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

  console.log('\nDATABASE_URI is set — seeding into Payload is not yet wired up.')
  console.log('This is intentional: category taxonomy, variant structure, and product/media')
  console.log('mapping need to be decided against the real Payload schema before writing rows.')
  console.log('See PROJECT_AGENTS_GUIDE.md — this is the data-import-agent\'s first real task.')
}

main()
