import { z } from 'zod'

// Claude's job is UNDERSTAND -> IDENTIFY -> LOCATE -> RETURN COORDINATES only — the crop itself is
// performed deterministically by sharp (see crop.ts). Coordinates are in the ORIGINAL rendered
// PNG's pixel space.
export const PageAnalysisSchema = z.object({
  // Catalogs commonly open with a cover/section-divider page (title, category banner, index) that
  // isn't a single product at all — Claude must classify this BEFORE any match/crop attempt runs,
  // so those pages are skipped cleanly instead of producing a bogus product_name/crop.
  is_product_page: z.boolean(),
  product_name: z.string(),
  composition: z.string().nullable(),
  strength: z.string().nullable(),
  pack_size: z.string().nullable(),
  mrp: z.string().nullable(),
  product_image: z.object({
    present: z.boolean(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  confidence: z.number(),
  notes: z.string(),
})

export type PageAnalysis = z.infer<typeof PageAnalysisSchema>

// Second, independent Claude pass over the CROPPED image only — catches a bounding box that
// technically ran but grabbed the logo/title/MRP instead of the actual product photo.
export const CropValidationSchema = z.object({
  valid: z.boolean(),
  confidence: z.number(),
  reason: z.string(),
})

export type CropValidation = z.infer<typeof CropValidationSchema>
