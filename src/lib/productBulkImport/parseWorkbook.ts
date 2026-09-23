import * as XLSX from 'xlsx'

import { COLUMNS, type ParsedRow } from './schema'

export type ParseError = { rowNumber: number; message: string }

export type ParseResult = {
  rows: ParsedRow[]
  errors: ParseError[]
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function splitList(value: unknown, separator: string | RegExp): string[] {
  const text = cellText(value)
  if (!text) return []
  return text
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseNumber(value: unknown): number | undefined {
  const text = cellText(value)
  if (!text) return undefined
  const num = Number(text)
  return Number.isFinite(num) ? num : undefined
}

function parseBoolean(value: unknown): boolean | undefined {
  const text = cellText(value).toLowerCase()
  if (!text) return undefined
  return text === 'true' || text === 'yes' || text === '1'
}

function parseStatus(value: unknown): 'published' | 'draft' {
  const text = cellText(value).toLowerCase()
  return text === 'draft' ? 'draft' : 'published'
}

// Sheet uses the first row as headers via sheet_to_json's default behavior — a plain object per
// row keyed by header text, so column order in the uploaded file doesn't matter, only the header
// names (which must match schema.ts's COLUMNS exactly).
export function parseWorkbook(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { rows: [], errors: [{ rowNumber: 0, message: 'The workbook has no sheets.' }] }
  }

  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
    defval: '',
  })

  const rows: ParsedRow[] = []
  const errors: ParseError[] = []

  records.forEach((record, index) => {
    // +2: 1 for the header row, 1 because spreadsheet rows are 1-indexed — matches what the
    // admin sees when they open the file in Excel/Sheets.
    const rowNumber = index + 2
    const title = cellText(record[COLUMNS.title])
    const priceInRupees = parseNumber(record[COLUMNS.priceInRupees])

    if (!title && priceInRupees === undefined) {
      // A fully blank row (trailing empty row in the sheet) — silently skip, not an error.
      return
    }

    if (!title) {
      errors.push({ rowNumber, message: `Missing "${COLUMNS.title}".` })
      return
    }
    if (priceInRupees === undefined) {
      errors.push({ rowNumber, message: `Missing or invalid "${COLUMNS.priceInRupees}".` })
      return
    }

    rows.push({
      rowNumber,
      slug: cellText(record[COLUMNS.slug]) || undefined,
      title,
      description: cellText(record[COLUMNS.description]) || undefined,
      composition: cellText(record[COLUMNS.composition]) || undefined,
      packing: cellText(record[COLUMNS.packing]) || undefined,
      packType: cellText(record[COLUMNS.packType]) || undefined,
      categories: splitList(record[COLUMNS.categories], ','),
      tags: splitList(record[COLUMNS.tags], ','),
      priceInRupees,
      compareAtPriceInRupees: parseNumber(record[COLUMNS.compareAtPriceInRupees]),
      discountPercent: parseNumber(record[COLUMNS.discountPercent]),
      showDiscountBadge: parseBoolean(record[COLUMNS.showDiscountBadge]),
      inventory: parseNumber(record[COLUMNS.inventory]),
      imageUrls: splitList(record[COLUMNS.imageUrls], ';'),
      status: parseStatus(record[COLUMNS.status]),
      relatedProducts: splitList(record[COLUMNS.relatedProducts], ','),
      metaTitle: cellText(record[COLUMNS.metaTitle]) || undefined,
      metaDescription: cellText(record[COLUMNS.metaDescription]) || undefined,
    })
  })

  return { rows, errors }
}
