import type { Endpoint } from 'payload'

import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import sharp from 'sharp'

import { checkRole } from '@/access/utilities'
import type { Media, Product, User } from '@/payload-types'
import { analyzePage, validateCrop } from '@/lib/productImageImporter/claudeVision'
import type { CropValidation, PageAnalysis } from '@/lib/productImageImporter/schemas'
import { cropAndOptimize, validateBoundingBox } from '@/lib/productImageImporter/crop'
import { AUTO_MATCH_CONFIDENCE, matchProduct, type MatchCandidate } from '@/lib/productImageImporter/productMatch'
import { getPdfPageCount, renderPdfPageToPng } from '@/lib/productImageImporter/pdfRender'

const forbidden = () => Response.json({ error: 'Forbidden' }, { status: 403 })
const notFound = (message = 'Not found') => Response.json({ error: message }, { status: 404 })
const badRequest = (message: string) => Response.json({ error: message }, { status: 400 })

const requireAdmin = (req: { user?: unknown }) => checkRole(['admin'], req.user as User | undefined)

const TEMP_ROOT = path.join(os.tmpdir(), 'product-image-importer')

function pagePngPath(tempDir: string, pageNumber: number) {
  return path.join(tempDir, 'pages', `page-${String(pageNumber).padStart(3, '0')}.png`)
}

function cropWebpPath(tempDir: string, pageNumber: number) {
  return path.join(tempDir, 'crops', `page-${String(pageNumber).padStart(3, '0')}.webp`)
}

async function readOrRenderPage(
  tempDir: string,
  pdfPath: string,
  pageNumber: number,
): Promise<{ png: Buffer; width: number; height: number }> {
  const cachedPath = pagePngPath(tempDir, pageNumber)
  try {
    const cached = await fs.readFile(cachedPath)
    const metadata = await sharp(cached).metadata()
    return { png: cached, width: metadata.width ?? 0, height: metadata.height ?? 0 }
  } catch {
    const pdfBuffer = await fs.readFile(pdfPath)
    const rendered = await renderPdfPageToPng(pdfBuffer, pageNumber)
    await fs.mkdir(path.dirname(cachedPath), { recursive: true })
    await fs.writeFile(cachedPath, rendered.png)
    return rendered
  }
}

// GET /product-image-importer — list recent jobs (for resuming after a page refresh)
const listJobsEndpoint: Endpoint = {
  path: '/product-image-importer',
  method: 'get',
  handler: async (req) => {
    if (!requireAdmin(req)) return forbidden()

    const jobs = await req.payload.find({
      collection: 'product-image-imports',
      depth: 0,
      limit: 20,
      sort: '-createdAt',
      select: { filename: true, pageCount: true, jobStatus: true, dryRun: true, createdAt: true },
    })

    return Response.json({ jobs: jobs.docs })
  },
}

// POST /product-image-importer — upload a PDF, create the job + PENDING page rows
const createJobEndpoint: Endpoint = {
  path: '/product-image-importer',
  method: 'post',
  handler: async (req) => {
    if (!requireAdmin(req)) return forbidden()
    if (!req.formData) return badRequest('Expected multipart/form-data upload')

    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return badRequest('Could not parse upload — expected multipart/form-data with a "file" field')
    }

    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return badRequest('Missing "file" field')
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdfBuffer = Buffer.from(arrayBuffer)

    if (pdfBuffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      return badRequest('The uploaded file is not a valid PDF')
    }

    let pageCount: number
    try {
      pageCount = await getPdfPageCount(pdfBuffer)
    } catch (err) {
      console.log('[PDF] Failed to read page count:', err)
      return badRequest('Could not read the PDF — it may be corrupted or encrypted')
    }

    if (pageCount < 1) {
      return badRequest('PDF has no pages')
    }

    const jobId = crypto.randomUUID()
    const tempDir = path.join(TEMP_ROOT, jobId)
    await fs.mkdir(tempDir, { recursive: true })
    await fs.writeFile(path.join(tempDir, 'source.pdf'), pdfBuffer)

    console.log(`[PDF] Loaded ${pageCount} pages from ${file.name}`)

    const job = await req.payload.create({
      collection: 'product-image-imports',
      data: {
        filename: file.name,
        pageCount,
        tempDir,
        dryRun: true,
        allowReplaceExisting: false,
        jobStatus: 'pending',
        pages: Array.from({ length: pageCount }, (_, i) => ({
          pageNumber: i + 1,
          status: 'PENDING' as const,
        })),
      },
    })

    return Response.json({ job })
  },
}

// GET /product-image-importer/:id — current job + page state (for polling)
const getJobEndpoint: Endpoint = {
  path: '/product-image-importer/:id',
  method: 'get',
  handler: async (req) => {
    if (!requireAdmin(req)) return forbidden()
    const id = req.routeParams?.id as string

    try {
      const job = await req.payload.findByID({ collection: 'product-image-imports', id })
      return Response.json({ job })
    } catch {
      return notFound('Import job not found')
    }
  },
}

// DELETE /product-image-importer/:id — clean up temp files + delete the job record
const deleteJobEndpoint: Endpoint = {
  path: '/product-image-importer/:id',
  method: 'delete',
  handler: async (req) => {
    if (!requireAdmin(req)) return forbidden()
    const id = req.routeParams?.id as string

    let job
    try {
      job = await req.payload.findByID({ collection: 'product-image-imports', id })
    } catch {
      return notFound('Import job not found')
    }

    if (job.tempDir) {
      await fs.rm(job.tempDir, { recursive: true, force: true }).catch(() => {})
    }

    await req.payload.delete({ collection: 'product-image-imports', id })
    return Response.json({ ok: true })
  },
}

// GET /product-image-importer/:id/asset?type=page|crop&page=N — serves a temp preview image.
// Path is built entirely from validated numeric input joined onto the job's own tempDir, so there
// is no user-controlled path segment to traverse with.
const assetEndpoint: Endpoint = {
  path: '/product-image-importer/:id/asset',
  method: 'get',
  handler: async (req) => {
    if (!requireAdmin(req)) return forbidden()
    const id = req.routeParams?.id as string
    const type = req.searchParams?.get('type')
    const pageParam = req.searchParams?.get('page')
    const pageNumber = pageParam ? Number(pageParam) : NaN

    if ((type !== 'page' && type !== 'crop') || !Number.isInteger(pageNumber) || pageNumber < 1) {
      return badRequest('Invalid asset request')
    }

    let job
    try {
      job = await req.payload.findByID({ collection: 'product-image-imports', id })
    } catch {
      return notFound('Import job not found')
    }

    const filePath = type === 'page' ? pagePngPath(job.tempDir, pageNumber) : cropWebpPath(job.tempDir, pageNumber)

    try {
      const buffer = await fs.readFile(filePath)
      return new Response(new Uint8Array(buffer), {
        headers: { 'Content-Type': type === 'page' ? 'image/png' : 'image/webp' },
      })
    } catch {
      return notFound('Asset not yet available')
    }
  },
}

async function fetchProductCandidates(req: Parameters<Endpoint['handler']>[0]): Promise<MatchCandidate[]> {
  const result = await req.payload.find({
    collection: 'products',
    depth: 0,
    limit: 2000,
    select: { title: true, slug: true, composition: true },
  })

  // A couple of legacy products in this database have a null title (pre-existing data issue,
  // unrelated to this feature) — they can never be meaningfully name-matched, so exclude them
  // rather than crash the matcher.
  return result.docs
    .filter((p): p is typeof p & { title: string } => Boolean(p.title))
    .map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug || '',
      composition: p.composition,
    }))
}

// POST /product-image-importer/:id/process — body { pageNumber }. Runs one page through
// analyze -> match -> crop -> validate. Idempotent per stage: if the page was already analyzed
// (e.g. a manual match was just applied), it resumes from the crop step instead of re-asking
// Claude to identify the product again.
const processPageEndpoint: Endpoint = {
  path: '/product-image-importer/:id/process',
  method: 'post',
  handler: async (req) => {
    if (!requireAdmin(req)) return forbidden()
    const id = req.routeParams?.id as string

    const body = (await req.json?.()) as
      | {
          pageNumber?: number
          // Manual overrides — used for a one-off, no-API-key run where Claude Code itself (this
          // conversation) supplies the vision analysis by looking at the rendered page directly.
          // Everything downstream (matching, crop math, bounds validation, DB writes) still runs
          // through the same code path as the automated flow.
          manualAnalysis?: PageAnalysis
          manualValidation?: CropValidation
        }
      | undefined
    const pageNumber = body?.pageNumber
    if (!pageNumber) return badRequest('Missing pageNumber')

    let job
    try {
      job = await req.payload.findByID({ collection: 'product-image-imports', id })
    } catch {
      return notFound('Import job not found')
    }

    const pages = job.pages || []
    const pageIndex = pages.findIndex((p) => p.pageNumber === pageNumber)
    if (pageIndex === -1) return notFound('Page not found in this job')

    const tag = `[PAGE ${pageNumber}]`
    let page = { ...pages[pageIndex] }

    const persist = async (patch: Partial<typeof page>) => {
      page = { ...page, ...patch }
      const nextPages = [...pages]
      nextPages[pageIndex] = page
      await req.payload.update({
        collection: 'product-image-imports',
        id,
        data: { pages: nextPages },
      })
    }

    try {
      await persist({ status: 'PROCESSING', error: null })

      console.log(`${tag} Rendering`)
      const pdfPath = path.join(job.tempDir, 'source.pdf')
      const rendered = await readOrRenderPage(job.tempDir, pdfPath, pageNumber)
      const pageWidth = rendered.width || page.pageWidth || 0
      const pageHeight = rendered.height || page.pageHeight || 0

      const alreadyAnalyzed =
        Boolean(page.detectedProductName) && page.status !== 'FAILED' && page.status !== 'SKIPPED'

      if (!alreadyAnalyzed) {
        const analysis = body?.manualAnalysis ?? (await analyzePage(rendered.png))
        if (body?.manualAnalysis) console.log(`${tag} Using manual analysis (Claude Code)`)

        if (!analysis.is_product_page) {
          console.log(`${tag} Not a product page (cover/divider/index) — skipping`)
          await persist({
            status: 'SKIPPED',
            detectedProductName: analysis.product_name || null,
            claudeConfidence: analysis.confidence,
            claudeNotes: analysis.notes,
            pageWidth,
            pageHeight,
            error: null,
          })
          return Response.json({ page })
        }

        console.log(`${tag} Claude identified: ${analysis.product_name} (confidence ${analysis.confidence})`)

        if (!analysis.product_image.present) {
          console.log(`${tag} No product image detected on page`)
          await persist({
            status: 'FAILED',
            detectedProductName: analysis.product_name,
            composition: analysis.composition,
            strength: analysis.strength,
            packSize: analysis.pack_size,
            mrp: analysis.mrp,
            claudeConfidence: analysis.confidence,
            claudeNotes: analysis.notes,
            pageWidth,
            pageHeight,
            error: 'No product photograph detected on this page',
          })
          return Response.json({ page })
        }

        await persist({
          detectedProductName: analysis.product_name,
          composition: analysis.composition,
          strength: analysis.strength,
          packSize: analysis.pack_size,
          mrp: analysis.mrp,
          claudeConfidence: analysis.confidence,
          claudeNotes: analysis.notes,
          pageWidth,
          pageHeight,
          cropBox: {
            present: analysis.product_image.present,
            x: analysis.product_image.x,
            y: analysis.product_image.y,
            width: analysis.product_image.width,
            height: analysis.product_image.height,
          },
        })
      }

      const alreadyManuallyMatched = page.matchMethod === 'manual' && page.matchedProduct

      if (!alreadyManuallyMatched) {
        const candidates = await fetchProductCandidates(req)
        const match = matchProduct(
          { name: page.detectedProductName || '', composition: page.composition },
          candidates,
        )

        if (match.product && match.confidence >= AUTO_MATCH_CONFIDENCE) {
          console.log(`${tag} Matched product: ${match.product.id} (confidence ${match.confidence})`)
        } else {
          console.log(`${tag} PRODUCT MATCH ${match.product ? 'LOW CONFIDENCE' : 'FAILED'}`)
          console.log(`${tag} Detected: ${page.detectedProductName}`)
          console.log(`${tag} Confidence: ${match.confidence}`)
          console.log(`${tag} Status: NEEDS_REVIEW`)
        }

        await persist({
          matchedProduct: match.product?.id ?? null,
          matchConfidence: match.confidence,
          matchMethod: match.method,
        })
      }

      const cropBox = page.cropBox
      if (!cropBox?.present || cropBox.x == null) {
        await persist({ status: 'NEEDS_REVIEW', error: 'No crop coordinates available' })
        return Response.json({ page })
      }

      const box = { x: cropBox.x!, y: cropBox.y!, width: cropBox.width!, height: cropBox.height! }
      const rejection = validateBoundingBox(box, pageWidth, pageHeight)
      if (rejection) {
        console.log(`${tag} Invalid bounding box: ${rejection}`)
        await persist({ status: 'FAILED', error: `Invalid crop coordinates (${rejection})` })
        return Response.json({ page })
      }

      console.log(`${tag} Crop: ${box.x},${box.y},${box.width},${box.height}`)
      const cropBuffer = await cropAndOptimize(rendered.png, box)
      await fs.mkdir(path.dirname(cropWebpPath(job.tempDir, pageNumber)), { recursive: true })
      await fs.writeFile(cropWebpPath(job.tempDir, pageNumber), cropBuffer)

      const validation = body?.manualValidation ?? (await validateCrop(cropBuffer))
      if (body?.manualValidation) console.log(`${tag} Using manual crop validation (Claude Code)`)
      console.log(`${tag} Crop validation: ${validation.valid ? 'PASS' : 'FAIL'} (${validation.reason})`)

      const isConfidentMatch = (page.matchConfidence ?? 0) >= AUTO_MATCH_CONFIDENCE && page.matchedProduct

      if (!validation.valid) {
        await persist({ status: 'NEEDS_REVIEW', validation, error: null })
      } else if (isConfidentMatch) {
        await persist({ status: 'CROPPED', validation, error: null })
      } else {
        await persist({ status: 'NEEDS_REVIEW', validation, error: null })
      }

      return Response.json({ page })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.log(`${tag} FAILED: ${message}`)
      await persist({ status: 'FAILED', error: message }).catch(() => {})
      return Response.json({ page }, { status: 200 })
    }
  },
}

// POST /product-image-importer/:id/manual-match — body { pageNumber, productId }
const manualMatchEndpoint: Endpoint = {
  path: '/product-image-importer/:id/manual-match',
  method: 'post',
  handler: async (req) => {
    if (!requireAdmin(req)) return forbidden()
    const id = req.routeParams?.id as string
    const body = (await req.json?.()) as { pageNumber?: number; productId?: number } | undefined

    if (!body?.pageNumber || !body?.productId) {
      return badRequest('Missing pageNumber or productId')
    }

    let job
    try {
      job = await req.payload.findByID({ collection: 'product-image-imports', id })
    } catch {
      return notFound('Import job not found')
    }

    const pages = job.pages || []
    const pageIndex = pages.findIndex((p) => p.pageNumber === body.pageNumber)
    if (pageIndex === -1) return notFound('Page not found')

    try {
      await req.payload.findByID({ collection: 'products', id: body.productId, depth: 0 })
    } catch {
      return badRequest('Selected product does not exist')
    }

    const isValidCrop = pages[pageIndex].validation?.valid

    const nextPages = [...pages]
    nextPages[pageIndex] = {
      ...nextPages[pageIndex],
      matchedProduct: body.productId,
      matchConfidence: 1,
      matchMethod: 'manual',
      status: isValidCrop ? 'CROPPED' : 'NEEDS_REVIEW',
    }

    const updated = await req.payload.update({
      collection: 'product-image-imports',
      id,
      data: { pages: nextPages },
    })

    return Response.json({ page: updated.pages?.[pageIndex] })
  },
}

// POST /product-image-importer/:id/import — body { pageNumbers: number[] }
// Uploads each page's validated crop to the existing media/S3 setup and writes ONLY
// gallery[0].image on the matched product — nothing else on the product is touched.
const importEndpoint: Endpoint = {
  path: '/product-image-importer/:id/import',
  method: 'post',
  handler: async (req) => {
    if (!requireAdmin(req)) return forbidden()
    const id = req.routeParams?.id as string
    const body = (await req.json?.()) as { pageNumbers?: number[] } | undefined
    const pageNumbers = body?.pageNumbers

    if (!pageNumbers?.length) return badRequest('Missing pageNumbers')

    let job
    try {
      job = await req.payload.findByID({ collection: 'product-image-imports', id })
    } catch {
      return notFound('Import job not found')
    }

    const pages = [...(job.pages || [])]
    const results: Array<{ pageNumber: number; ok: boolean; message?: string }> = []

    for (const pageNumber of pageNumbers) {
      const pageIndex = pages.findIndex((p) => p.pageNumber === pageNumber)
      if (pageIndex === -1) {
        results.push({ pageNumber, ok: false, message: 'Page not found' })
        continue
      }

      const page = pages[pageIndex]
      const tag = `[PAGE ${pageNumber}]`

      if (page.status !== 'CROPPED' || !page.matchedProduct) {
        results.push({ pageNumber, ok: false, message: 'Page is not in a ready-to-import state' })
        continue
      }

      try {
        const productId = typeof page.matchedProduct === 'object' ? page.matchedProduct.id : page.matchedProduct
        const product = (await req.payload.findByID({
          collection: 'products',
          id: productId,
          depth: 0,
        })) as Product

        const existingImage = product.gallery?.[0]?.image
        const hadGalleryBeforeImport = Boolean(product.gallery && product.gallery.length > 0)

        if (existingImage && !job.allowReplaceExisting) {
          console.log(`${tag} SKIPPED: product already has an image and replace is disabled`)
          results.push({ pageNumber, ok: false, message: 'Skipped — product already has an image' })
          continue
        }

        const cropBuffer = await fs.readFile(cropWebpPath(job.tempDir, pageNumber))
        const filename = `${product.slug || `product-${product.id}`}.webp`

        const mediaDoc = (await req.payload.create({
          collection: 'media',
          data: { alt: product.title },
          file: { data: cropBuffer, mimetype: 'image/webp', name: filename, size: cropBuffer.length },
        })) as Media

        console.log(`${tag} Uploaded: ${filename}`)

        const nextGallery = product.gallery && product.gallery.length > 0
          ? product.gallery.map((row, i) => (i === 0 ? { ...row, image: mediaDoc.id } : row))
          : [{ image: mediaDoc.id }]

        await req.payload.update({
          collection: 'products',
          id: product.id,
          data: { gallery: nextGallery },
        })

        console.log(`${tag} Database updated`)
        console.log(`${tag} COMPLETE`)

        pages[pageIndex] = {
          ...page,
          status: 'COMPLETED',
          uploadedMedia: mediaDoc.id,
          previousGalleryImage: typeof existingImage === 'object' ? existingImage?.id : existingImage,
          hadGalleryBeforeImport,
          imported: true,
          error: null,
        }
        results.push({ pageNumber, ok: true })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.log(`${tag} IMPORT FAILED: ${message}`)
        pages[pageIndex] = { ...page, status: 'FAILED', error: message }
        results.push({ pageNumber, ok: false, message })
      }
    }

    await req.payload.update({
      collection: 'product-image-imports',
      id,
      data: { pages },
    })

    return Response.json({ results })
  },
}

// POST /product-image-importer/:id/revert — body { pageNumber }
// Restores the product's gallery[0].image to whatever it was before this import.
const revertEndpoint: Endpoint = {
  path: '/product-image-importer/:id/revert',
  method: 'post',
  handler: async (req) => {
    if (!requireAdmin(req)) return forbidden()
    const id = req.routeParams?.id as string
    const body = (await req.json?.()) as { pageNumber?: number } | undefined

    if (!body?.pageNumber) return badRequest('Missing pageNumber')

    let job
    try {
      job = await req.payload.findByID({ collection: 'product-image-imports', id })
    } catch {
      return notFound('Import job not found')
    }

    const pages = [...(job.pages || [])]
    const pageIndex = pages.findIndex((p) => p.pageNumber === body.pageNumber)
    if (pageIndex === -1) return notFound('Page not found')

    const page = pages[pageIndex]
    if (!page.imported || !page.matchedProduct) {
      return badRequest('This page has not been imported')
    }

    const productId = typeof page.matchedProduct === 'object' ? page.matchedProduct.id : page.matchedProduct
    const product = (await req.payload.findByID({ collection: 'products', id: productId, depth: 0 })) as Product

    if (page.hadGalleryBeforeImport && page.previousGalleryImage) {
      const previousId =
        typeof page.previousGalleryImage === 'object' ? page.previousGalleryImage.id : page.previousGalleryImage
      const nextGallery = (product.gallery || []).map((row, i) =>
        i === 0 ? { ...row, image: previousId } : row,
      )
      await req.payload.update({ collection: 'products', id: product.id, data: { gallery: nextGallery } })
    } else {
      // No gallery row existed before this import — remove the one we added.
      const nextGallery = (product.gallery || []).slice(1)
      await req.payload.update({ collection: 'products', id: product.id, data: { gallery: nextGallery } })
    }

    pages[pageIndex] = { ...page, status: 'CROPPED', imported: false }
    await req.payload.update({ collection: 'product-image-imports', id, data: { pages } })

    console.log(`[PAGE ${body.pageNumber}] Reverted product ${productId}'s image`)

    return Response.json({ ok: true })
  },
}

// POST /product-image-importer/:id/settings — body { dryRun?, allowReplaceExisting? }
const updateSettingsEndpoint: Endpoint = {
  path: '/product-image-importer/:id/settings',
  method: 'post',
  handler: async (req) => {
    if (!requireAdmin(req)) return forbidden()
    const id = req.routeParams?.id as string
    const body = (await req.json?.()) as { dryRun?: boolean; allowReplaceExisting?: boolean } | undefined

    const data: Record<string, boolean> = {}
    if (typeof body?.dryRun === 'boolean') data.dryRun = body.dryRun
    if (typeof body?.allowReplaceExisting === 'boolean') data.allowReplaceExisting = body.allowReplaceExisting

    const job = await req.payload.update({ collection: 'product-image-imports', id, data })
    return Response.json({ job })
  },
}

export const productImageImporterEndpoints: Endpoint[] = [
  listJobsEndpoint,
  createJobEndpoint,
  getJobEndpoint,
  deleteJobEndpoint,
  assetEndpoint,
  processPageEndpoint,
  manualMatchEndpoint,
  importEndpoint,
  revertEndpoint,
  updateSettingsEndpoint,
]
