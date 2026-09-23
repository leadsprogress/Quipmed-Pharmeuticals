// Column headers for the bulk-import/export spreadsheet — the single source of truth for the
// generated sample file, the export, and the uploaded-file parser, so all three can never drift
// out of sync with each other.
//
// Names/order mirror Shopify's standard products_export.csv (Handle, Title, Body (HTML), Vendor,
// Product Category, Type, Tags, Variant SKU/Inventory Qty/Price/Compare At Price, Image Src,
// SEO Title/Description, Status) so the sheet reads the same way a Shopify merchant already
// expects. Shopify's own export has ~64 columns, but most only exist because that particular
// store has apps installed (Google Shopping, EComposer, a reviews app) or because of Shopify's
// variant/multi-market pricing system (Option1-3, Unit Price *, Included/Price/CompareAtPrice per
// country) — none of which apply here, since this importer only handles simple (non-variant)
// products. Those are intentionally left out rather than carried over as permanently-blank noise.
// Fields with no Shopify equivalent (Composition, Packing, Discount Percent, Show Discount
// Badge) are kept as extra columns appended after the Shopify-named ones, since dropping them
// would lose real functionality already built (the compare-price/discount sync, the badge toggle).
export const COLUMNS = {
  handle: 'Handle',
  title: 'Title',
  bodyHtml: 'Body (HTML)',
  vendor: 'Vendor',
  productCategory: 'Product Category',
  type: 'Type',
  tags: 'Tags',
  variantSku: 'Variant SKU',
  variantInventoryQty: 'Variant Inventory Qty',
  variantPrice: 'Variant Price',
  variantCompareAtPrice: 'Variant Compare At Price',
  imageSrc: 'Image Src',
  seoTitle: 'SEO Title',
  seoDescription: 'SEO Description',
  status: 'Status',
  composition: 'Composition',
  packing: 'Packing',
  discountPercent: 'Discount Percent',
  showDiscountBadge: 'Show Discount Badge',
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

// Matches Shopify's own Status column values exactly (lowercase).
export const STATUS_OPTIONS = ['active', 'draft']

export type ParsedRow = {
  rowNumber: number
  handle?: string
  title: string
  bodyHtml?: string
  vendor?: string
  productCategory: string[]
  type?: string
  tags: string[]
  variantSku?: string
  variantInventoryQty?: number
  variantPrice: number
  variantCompareAtPrice?: number
  imageSrc: string[]
  seoTitle?: string
  seoDescription?: string
  status: 'published' | 'draft'
  composition?: string
  packing?: string
  discountPercent?: number
  showDiscountBadge?: boolean
}

export const SAMPLE_ROWS: Record<(typeof COLUMNS)[keyof typeof COLUMNS], string | number>[] = [
  {
    [COLUMNS.handle]: '',
    [COLUMNS.title]: 'Paracetamol 500 Tablets',
    [COLUMNS.bodyHtml]:
      'Contains PARACETAMOL 500 MG, an analgesic and antipyretic commonly used for relief from pain and fever.',
    [COLUMNS.vendor]: '',
    [COLUMNS.productCategory]: 'Antiinflammatory & Analgesics',
    [COLUMNS.type]: 'Tablet',
    [COLUMNS.tags]: 'Bestseller, New',
    [COLUMNS.variantSku]: '',
    [COLUMNS.variantInventoryQty]: 100,
    [COLUMNS.variantPrice]: 45,
    [COLUMNS.variantCompareAtPrice]: 55,
    [COLUMNS.imageSrc]:
      'https://example.com/images/paracetamol-500-front.jpg, https://example.com/images/paracetamol-500-back.jpg',
    [COLUMNS.seoTitle]: '',
    [COLUMNS.seoDescription]: '',
    [COLUMNS.status]: 'active',
    [COLUMNS.composition]: 'PARACETAMOL 500 MG',
    [COLUMNS.packing]: '10*10',
    [COLUMNS.discountPercent]: '',
    [COLUMNS.showDiscountBadge]: 'TRUE',
  },
  {
    [COLUMNS.handle]: '',
    [COLUMNS.title]: 'Cetrizine 10 Tablets',
    [COLUMNS.bodyHtml]:
      'Contains CETIRIZINE 10 MG, an antihistamine commonly used for relief from allergic symptoms.',
    [COLUMNS.vendor]: '',
    [COLUMNS.productCategory]: 'Respiratory & Anti-allergics',
    [COLUMNS.type]: 'Tablet',
    [COLUMNS.tags]: '',
    [COLUMNS.variantSku]: '',
    [COLUMNS.variantInventoryQty]: 200,
    [COLUMNS.variantPrice]: 30,
    [COLUMNS.variantCompareAtPrice]: '',
    [COLUMNS.imageSrc]: '',
    [COLUMNS.seoTitle]: '',
    [COLUMNS.seoDescription]: '',
    [COLUMNS.status]: 'active',
    [COLUMNS.composition]: 'CETIRIZINE 10 MG',
    [COLUMNS.packing]: '10*10',
    [COLUMNS.discountPercent]: 15,
    [COLUMNS.showDiscountBadge]: 'TRUE',
  },
]

export const COLUMN_NOTES: Record<string, string> = {
  [COLUMNS.handle]:
    'Optional — Shopify-style URL slug. Leave blank to auto-generate one from Title (like Shopify does). If it matches an existing product\'s handle, that product is updated; otherwise matching falls back to an exact Title match.',
  [COLUMNS.title]:
    'Required. Adding a new product? Pick any title that isn\'t already in use. Updating an existing one (and not using Handle)? Type its exact current title — blank columns on that row are left as-is, only filled-in ones change.',
  [COLUMNS.bodyHtml]: 'Plain text product description. Each blank line starts a new paragraph.',
  [COLUMNS.vendor]: 'Optional manufacturer/brand name.',
  [COLUMNS.productCategory]:
    'Comma-separated (e.g. "Diabetic Range, New Launches"). Must match existing category names exactly (not case-sensitive). Unmatched names are skipped and reported.',
  [COLUMNS.type]: 'The product\'s pack type, e.g. "Tablet", "Syrup".',
  [COLUMNS.tags]: 'Comma-separated (e.g. "Bestseller, New"). Created automatically if they don\'t already exist.',
  [COLUMNS.variantSku]: 'Optional unique product code. Leave blank to auto-generate one (e.g. "QM-4F82K9").',
  [COLUMNS.variantInventoryQty]: 'Stock count.',
  [COLUMNS.variantPrice]: 'Required. Plain rupees, e.g. 199 or 199.50 — not paise.',
  [COLUMNS.variantCompareAtPrice]:
    'Optional "was" price shown crossed out. Leave blank to auto-fill, or fill in Discount Percent instead — the two are linked.',
  [COLUMNS.imageSrc]:
    'One or more direct image URLs, separated by commas. The first one becomes the main product photo, the rest go into its photo gallery. Leave blank to keep any existing photos.',
  [COLUMNS.seoTitle]: 'Optional SEO page title. Leave blank to use the product Title.',
  [COLUMNS.seoDescription]: 'Optional SEO page description.',
  [COLUMNS.status]: 'active or draft (matches Shopify\'s own values). Leave blank for active.',
  [COLUMNS.composition]: 'Active ingredient / salt composition, e.g. "DAPAGLIFLOZIN 5 MG". No Shopify equivalent.',
  [COLUMNS.packing]: 'e.g. "10*10" (strips per box). No Shopify equivalent.',
  [COLUMNS.discountPercent]: 'Optional, 0-99. Linked to Variant Compare At Price — fill in either one. No Shopify equivalent.',
  [COLUMNS.showDiscountBadge]: 'TRUE or FALSE. Leave blank for TRUE (default). No Shopify equivalent.',
}
