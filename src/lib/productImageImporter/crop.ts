import sharp from 'sharp'

export type BoundingBox = { x: number; y: number; width: number; height: number }

export type CropRejection =
  | 'no_bounding_box'
  | 'out_of_bounds'
  | 'too_small'
  | 'covers_whole_page'
  | 'invalid_dimensions'

// Bounds checks BEFORE touching sharp — Claude's coordinates are a suggestion, not a guarantee.
// Rejecting here (rather than clamping into something plausible-looking) is deliberate: a
// wildly-wrong box should surface as NEEDS_REVIEW, not silently produce a bad crop.
export function validateBoundingBox(
  box: BoundingBox,
  pageWidth: number,
  pageHeight: number,
): CropRejection | null {
  if (!Number.isFinite(box.x) || !Number.isFinite(box.y) || !Number.isFinite(box.width) || !Number.isFinite(box.height)) {
    return 'invalid_dimensions'
  }
  if (box.width <= 0 || box.height <= 0) {
    return 'invalid_dimensions'
  }
  if (box.x < 0 || box.y < 0 || box.x + box.width > pageWidth || box.y + box.height > pageHeight) {
    return 'out_of_bounds'
  }

  const pageArea = pageWidth * pageHeight
  const boxArea = box.width * box.height

  // A real product photo on these catalog pages is a modest fraction of the page — reject
  // anything under ~1.5% (almost certainly a mis-fired tiny box) or over ~85% (almost certainly
  // grabbed the whole page instead of just the photo).
  if (boxArea < pageArea * 0.015) {
    return 'too_small'
  }
  if (boxArea > pageArea * 0.85) {
    return 'covers_whole_page'
  }

  return null
}

// Every storefront product-image container (ProductGridItem, FlipProductCard, ProductItem, ...)
// renders via a fixed aspect-square box with `object-cover` — so the uploaded asset itself should
// already BE a square of one consistent size. Doing the square crop here (not relying on the
// browser's object-cover) is what actually makes every imported image "the same size": a
// letterboxed (contain-fit) output would still get unevenly re-cropped per-image by object-cover
// on the frontend, which is the opposite of consistent.
const OUTPUT_SIZE = 1200
const WEBP_QUALITY = 86

// Crop -> trim uniform-color padding -> center-crop to a fixed square -> encode. Sharp never
// touches pixel content beyond crop/trim/resize — no color, generative, or content changes; fit:
// 'cover' preserves aspect ratio (crops overflow, never distorts/stretches).
export async function cropAndOptimize(pagePng: Buffer, box: BoundingBox): Promise<Buffer> {
  const extracted = {
    left: Math.round(box.x),
    top: Math.round(box.y),
    width: Math.round(box.width),
    height: Math.round(box.height),
  }

  // libvips' trim throws "bad extract area" rather than a no-op when it can't find a trimmable
  // border to compute (e.g. content already touches the crop edges) — that's a legitimate outcome
  // here, not a real error, so fall back to the untrimmed crop instead of failing the whole page.
  let trimmedBuffer: Buffer
  try {
    trimmedBuffer = await sharp(pagePng)
      .extract(extracted)
      .trim({ background: '#ffffff', threshold: 12 })
      .toBuffer()
  } catch {
    trimmedBuffer = await sharp(pagePng).extract(extracted).toBuffer()
  }

  return sharp(trimmedBuffer)
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: 'cover', position: 'centre' })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()
}
