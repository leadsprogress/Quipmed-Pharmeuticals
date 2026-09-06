import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'

import { CropValidationSchema, PageAnalysisSchema, type CropValidation, type PageAnalysis } from './schemas'

// Server-side only — never import this module from a client component. The API key is read from
// the environment by the SDK's zero-arg client and is never sent to the browser.
const client = new Anthropic()

// Read lazily (inside each call) rather than at module load — this file is imported transitively
// by payload.config.ts, which tooling like `payload generate:types` also loads without a full
// runtime .env in place.
function getModel(): string {
  const model = process.env.ANTHROPIC_MODEL
  if (!model) {
    throw new Error('ANTHROPIC_MODEL is not set — see .env.example')
  }
  return model
}

const MAX_RETRIES = 4
const BASE_DELAY_MS = 1000

async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let attempt = 0
  for (;;) {
    try {
      return await fn()
    } catch (err) {
      const retryable =
        err instanceof Anthropic.RateLimitError ||
        err instanceof Anthropic.InternalServerError ||
        err instanceof Anthropic.APIConnectionError

      if (!retryable || attempt >= MAX_RETRIES) {
        throw err
      }

      const delay = BASE_DELAY_MS * 2 ** attempt
      console.log(`[Claude] ${label} failed (attempt ${attempt + 1}), retrying in ${delay}ms`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      attempt += 1
    }
  }
}

const ANALYSIS_PROMPT = `You are analyzing one page of a pharmaceutical product catalog PDF. Most pages each represent exactly ONE product (company logo, decorative background elements, the product name/title, its composition, strength/dosage, pack size, MRP, and a photograph of the actual medicine box/blister/packaging) — but a catalog like this can also open with a cover page, section/category divider (e.g. a banner reading "CARDIAC & DIABETIC PRODUCTS"), table of contents, or other non-product page.

FIRST, before anything else: decide whether this page actually represents a single product page (set is_product_page accordingly). A page is NOT a product page if it has no specific product name+photograph — e.g. it's just a category title, a divider, an index, or blank/decorative. If is_product_page is false, you may leave the other fields at reasonable defaults (empty string / not-present) — they will be ignored.

If it IS a product page, identify:
1. The product name exactly as printed (including strength if it's part of the name, e.g. "BISODROP 2.5")
2. The composition/active ingredient if visible
3. The strength/dosage if visible (may be separate from the name)
4. The pack size if visible (e.g. "20 x 10 Tablets" or "10*10")
5. The MRP if visible (digits only, no currency symbol)
6. The location of the ACTUAL PRODUCT PHOTOGRAPH — the real photo of the medicine box/blister/bottle — as a pixel bounding box

CRITICAL for the bounding box: it must contain ONLY the product photograph itself. Do NOT include the company logo, the product title text, the MRP/price text, or decorative background bars/shapes/graphics in the box. If you can see the box and the blister strip as separate photo elements near each other, include both if they're part of the same product photo composition, but exclude everything else around them.

Coordinates (x, y, width, height) must be in pixels, measured against the image exactly as provided (origin at top-left).

If this IS a product page but you cannot find a genuine product photograph on it (only text/logo/decoration), set product_image.present to false and x/y/width/height to 0.

Respond with your analysis of this single page.`

export async function analyzePage(pngBuffer: Buffer): Promise<PageAnalysis> {
  const response = await withRetry('analyzePage', () =>
    client.messages.parse({
      model: getModel(),
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/png', data: pngBuffer.toString('base64') },
            },
            { type: 'text', text: ANALYSIS_PROMPT },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(PageAnalysisSchema) },
    }),
  )

  if (!response.parsed_output) {
    throw new Error('Claude did not return parseable JSON for page analysis')
  }

  return response.parsed_output
}

const VALIDATION_PROMPT =
  'Does this cropped image contain ONLY the actual product photograph (the medicine box/blister/bottle itself), and NOT any surrounding catalog text, company logo, product title, pricing, or decorative background elements? Be strict — if any non-product content is visible in the crop, mark it invalid.'

export async function validateCrop(cropBuffer: Buffer, mediaType: 'image/webp' | 'image/png' = 'image/webp'): Promise<CropValidation> {
  const response = await withRetry('validateCrop', () =>
    client.messages.parse({
      model: getModel(),
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: cropBuffer.toString('base64') },
            },
            { type: 'text', text: VALIDATION_PROMPT },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(CropValidationSchema) },
    }),
  )

  if (!response.parsed_output) {
    throw new Error('Claude did not return parseable JSON for crop validation')
  }

  return response.parsed_output
}
