// Column headers for the bulk-import spreadsheet — the single source of truth for both the
// generated sample file (generateSampleWorkbook.ts) and the uploaded-file parser (parseWorkbook.ts),
// so the two can never drift out of sync with each other.
export const COLUMNS = {
  slug: 'Slug',
  title: 'Title',
  description: 'Description',
  composition: 'Composition',
  packing: 'Packing',
  packType: 'Pack Type',
  categories: 'Categories',
  tags: 'Tags',
  priceInRupees: 'Price (INR)',
  compareAtPriceInRupees: 'Compare At Price (INR)',
  discountPercent: 'Discount Percent',
  showDiscountBadge: 'Show Discount Badge',
  inventory: 'Inventory',
  imageUrls: 'Image URLs',
  status: 'Status',
  relatedProducts: 'Related Products',
  metaTitle: 'Meta Title',
  metaDescription: 'Meta Description',
} as const

export const COLUMN_ORDER = Object.values(COLUMNS)

export type ParsedRow = {
  rowNumber: number
  slug?: string
  title: string
  description?: string
  composition?: string
  packing?: string
  packType?: string
  categories: string[]
  tags: string[]
  priceInRupees: number
  compareAtPriceInRupees?: number
  discountPercent?: number
  showDiscountBadge?: boolean
  inventory?: number
  imageUrls: string[]
  status: 'published' | 'draft'
  relatedProducts: string[]
  metaTitle?: string
  metaDescription?: string
}

export const SAMPLE_ROWS: Record<(typeof COLUMNS)[keyof typeof COLUMNS], string | number>[] = [
  {
    [COLUMNS.slug]: '',
    [COLUMNS.title]: 'Paracetamol 500 Tablets',
    [COLUMNS.description]: 'Contains PARACETAMOL 500 MG, an analgesic and antipyretic commonly used for relief from pain and fever.',
    [COLUMNS.composition]: 'PARACETAMOL 500 MG',
    [COLUMNS.packing]: '10*10',
    [COLUMNS.packType]: 'Tablet',
    [COLUMNS.categories]: 'Antiinflammatory & Analgesics',
    [COLUMNS.tags]: 'Bestseller',
    [COLUMNS.priceInRupees]: 45,
    [COLUMNS.compareAtPriceInRupees]: 55,
    [COLUMNS.discountPercent]: '',
    [COLUMNS.showDiscountBadge]: 'TRUE',
    [COLUMNS.inventory]: 100,
    [COLUMNS.imageUrls]: 'https://example.com/images/paracetamol-500-front.jpg',
    [COLUMNS.status]: 'Published',
    [COLUMNS.relatedProducts]: '',
    [COLUMNS.metaTitle]: '',
    [COLUMNS.metaDescription]: '',
  },
  {
    [COLUMNS.slug]: '',
    [COLUMNS.title]: 'Cetrizine 10 Tablets',
    [COLUMNS.description]: 'Contains CETIRIZINE 10 MG, an antihistamine commonly used for relief from allergic symptoms.',
    [COLUMNS.composition]: 'CETIRIZINE 10 MG',
    [COLUMNS.packing]: '10*10',
    [COLUMNS.packType]: 'Tablet',
    [COLUMNS.categories]: 'Respiratory & Anti-allergics',
    [COLUMNS.tags]: '',
    [COLUMNS.priceInRupees]: 30,
    [COLUMNS.compareAtPriceInRupees]: '',
    [COLUMNS.discountPercent]: 15,
    [COLUMNS.showDiscountBadge]: 'TRUE',
    [COLUMNS.inventory]: 200,
    [COLUMNS.imageUrls]: '',
    [COLUMNS.status]: 'Published',
    [COLUMNS.relatedProducts]: 'Paracetamol 500 Tablets',
    [COLUMNS.metaTitle]: '',
    [COLUMNS.metaDescription]: '',
  },
  {
    [COLUMNS.slug]: 'existing-product-slug',
    [COLUMNS.title]: 'Existing Product Example',
    [COLUMNS.description]: '',
    [COLUMNS.composition]: '',
    [COLUMNS.packing]: '',
    [COLUMNS.packType]: '',
    [COLUMNS.categories]: '',
    [COLUMNS.tags]: '',
    [COLUMNS.priceInRupees]: 99,
    [COLUMNS.compareAtPriceInRupees]: '',
    [COLUMNS.discountPercent]: '',
    [COLUMNS.showDiscountBadge]: '',
    [COLUMNS.inventory]: '',
    [COLUMNS.imageUrls]: '',
    [COLUMNS.status]: '',
    [COLUMNS.relatedProducts]: '',
    [COLUMNS.metaTitle]: '',
    [COLUMNS.metaDescription]: '',
  },
]

export const COLUMN_NOTES: Record<string, string> = {
  [COLUMNS.slug]:
    'Leave blank when adding a new product. Fill in an existing product\'s slug to update it — only the columns you fill in on that row are changed, blank columns are left as-is.',
  [COLUMNS.title]: 'Required.',
  [COLUMNS.description]: 'Plain text. Each blank line starts a new paragraph.',
  [COLUMNS.categories]: 'Comma-separated. Must match existing category names exactly (not case-sensitive). Unmatched names are skipped and reported.',
  [COLUMNS.tags]: 'Comma-separated (e.g. "Bestseller, New"). Created automatically if they don\'t already exist.',
  [COLUMNS.priceInRupees]: 'Required. Plain rupees, e.g. 199 or 199.50 — not paise.',
  [COLUMNS.compareAtPriceInRupees]: 'Optional "was" price shown crossed out. Leave blank to auto-fill, or fill in Discount Percent instead — the two are linked.',
  [COLUMNS.discountPercent]: 'Optional, 0-99. Linked to Compare At Price — fill in either one.',
  [COLUMNS.showDiscountBadge]: 'TRUE or FALSE. Leave blank for TRUE (default).',
  [COLUMNS.imageUrls]:
    'One or more direct image URLs, separated by semicolons ( ; ). The first becomes the main product photo. Leave blank to keep any existing photo.',
  [COLUMNS.status]: 'Published or Draft. Leave blank for Published.',
  [COLUMNS.relatedProducts]:
    'Comma-separated existing product titles to show in that product\'s "Related Products" rail. Must already exist at import time — a product listed earlier in the same file won\'t be found yet.',
  [COLUMNS.metaTitle]: 'Optional SEO page title. Leave blank to use the product Title.',
  [COLUMNS.metaDescription]: 'Optional SEO page description.',
}
