import ExcelJS from 'exceljs'

import type { Product } from '@/payload-types'
import { COLUMN_ORDER, COLUMNS } from './schema'
import { lexicalToPlainText } from './lexicalToPlainText'

function titleOf(item: number | { title: string }): string | null {
  return typeof item === 'object' ? item.title : null
}

function labelOf(item: number | { label: string }): string | null {
  return typeof item === 'object' ? item.label : null
}

function imageUrl(item: { image?: number | { url?: string | null } | null }): string | null {
  if (!item.image || typeof item.image !== 'object' || !item.image.url) return null
  return `${process.env.NEXT_PUBLIC_SERVER_URL || ''}${item.image.url}`
}

function productToRow(product: Product): Record<string, string | number> {
  return {
    [COLUMNS.handle]: product.slug ?? '',
    [COLUMNS.title]: product.title,
    [COLUMNS.bodyHtml]: lexicalToPlainText(product.description),
    [COLUMNS.vendor]: product.vendor ?? '',
    [COLUMNS.productCategory]: (product.categories ?? []).map(titleOf).filter(Boolean).join(', '),
    [COLUMNS.type]: product.packType ?? '',
    [COLUMNS.tags]: (product.tags ?? []).map(labelOf).filter(Boolean).join(', '),
    [COLUMNS.variantSku]: product.sku ?? '',
    [COLUMNS.variantInventoryQty]: product.inventory ?? '',
    [COLUMNS.variantPrice]: typeof product.priceInINR === 'number' ? product.priceInINR / 100 : '',
    [COLUMNS.variantCompareAtPrice]:
      typeof product.compareAtPrice === 'number' ? product.compareAtPrice / 100 : '',
    [COLUMNS.imageSrc]: (product.gallery ?? []).map(imageUrl).filter(Boolean).join(', '),
    [COLUMNS.seoTitle]: product.meta?.title ?? '',
    [COLUMNS.seoDescription]: product.meta?.description ?? '',
    [COLUMNS.status]: product._status === 'published' ? 'active' : 'draft',
    [COLUMNS.composition]: product.composition ?? '',
    [COLUMNS.packing]: product.packing ?? '',
    [COLUMNS.discountPercent]: typeof product.discountPercent === 'number' ? product.discountPercent : '',
    [COLUMNS.showDiscountBadge]: product.showDiscountBadge === false ? 'FALSE' : 'TRUE',
  }
}

// Same column set/order as the import sample, so an exported file can be edited and re-uploaded
// as-is.
export async function generateExportWorkbook(products: Product[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()

  const sheet = workbook.addWorksheet('Products')
  sheet.columns = COLUMN_ORDER.map((header) => ({ header, key: header, width: Math.max(header.length + 2, 18) }))
  products.forEach((product) => sheet.addRow(productToRow(product)))

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
