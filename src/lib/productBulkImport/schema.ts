// Column headers for the bulk-import spreadsheet — the single source of truth for both the
// generated sample file (generateSampleWorkbook.ts) and the uploaded-file parser (parseWorkbook.ts),
// so the two can never drift out of sync with each other.
export const COLUMNS = {
  title: 'Title',
  sku: 'SKU',
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
  metaTitle: 'Meta Title',
  metaDescription: 'Meta Description',
} as const

export const COLUMN_ORDER = Object.values(COLUMNS)

export const PACK_TYPE_OPTIONS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Ointment',
  'Cream',
  'Gel',
  'Drops',
  'Powder',
  'Inhaler',
  'Sachet',
  'Other',
]

export const STATUS_OPTIONS = ['Published', 'Draft']

export type ParsedRow = {
  rowNumber: number
  title: string
  sku?: string
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
  metaTitle?: string
  metaDescription?: string
}

export const SAMPLE_ROWS: Record<(typeof COLUMNS)[keyof typeof COLUMNS], string | number>[] = [
  {
    [COLUMNS.title]: 'Paracetamol 500 Tablets',
    [COLUMNS.sku]: '',
    [COLUMNS.description]: 'Contains PARACETAMOL 500 MG, an analgesic and antipyretic commonly used for relief from pain and fever.',
    [COLUMNS.composition]: 'PARACETAMOL 500 MG',
    [COLUMNS.packing]: '10*10',
    [COLUMNS.packType]: 'Tablet',
    [COLUMNS.categories]: 'Antiinflammatory & Analgesics',
    [COLUMNS.tags]: 'Bestseller, New',
    [COLUMNS.priceInRupees]: 45,
    [COLUMNS.compareAtPriceInRupees]: 55,
    [COLUMNS.discountPercent]: '',
    [COLUMNS.showDiscountBadge]: 'TRUE',
    [COLUMNS.inventory]: 100,
    [COLUMNS.imageUrls]:
      'https://example.com/images/paracetamol-500-front.jpg, https://example.com/images/paracetamol-500-back.jpg',
    [COLUMNS.status]: 'Published',
    [COLUMNS.metaTitle]: '',
    [COLUMNS.metaDescription]: '',
  },
  {
    [COLUMNS.title]: 'Cetrizine 10 Tablets',
    [COLUMNS.sku]: '',
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
    [COLUMNS.metaTitle]: '',
    [COLUMNS.metaDescription]: '',
  },
]

export const COLUMN_NOTES: Record<string, string> = {
  [COLUMNS.title]:
    'Required. Adding a new product? Pick any title that isn\'t already in use. Updating an existing one? Type its exact current title — matching is by exact Title, so the spelling/capitalization must match exactly (blank columns on that row are left as-is, only filled-in ones change).',
  [COLUMNS.sku]: 'Optional unique product code. Leave blank to auto-generate one (e.g. "QM-4F82K9").',
  [COLUMNS.description]: 'Plain text. Each blank line starts a new paragraph.',
  [COLUMNS.categories]:
    'Comma-separated (e.g. "Diabetic Range, New Launches"). Must match existing category names exactly (not case-sensitive). Unmatched names are skipped and reported.',
  [COLUMNS.tags]: 'Comma-separated (e.g. "Bestseller, New"). Created automatically if they don\'t already exist.',
  [COLUMNS.priceInRupees]: 'Required. Plain rupees, e.g. 199 or 199.50 — not paise.',
  [COLUMNS.compareAtPriceInRupees]: 'Optional "was" price shown crossed out. Leave blank to auto-fill, or fill in Discount Percent instead — the two are linked.',
  [COLUMNS.discountPercent]: 'Optional, 0-99. Linked to Compare At Price — fill in either one.',
  [COLUMNS.showDiscountBadge]: 'TRUE or FALSE. Leave blank for TRUE (default).',
  [COLUMNS.imageUrls]:
    'One or more direct image URLs, separated by commas. The first one becomes the main product photo, the rest go into its photo gallery. Leave blank to keep any existing photos.',
  [COLUMNS.status]: 'Published or Draft. Leave blank for Published.',
  [COLUMNS.metaTitle]: 'Optional SEO page title. Leave blank to use the product Title.',
  [COLUMNS.metaDescription]: 'Optional SEO page description.',
}
