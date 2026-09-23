import type { Endpoint } from 'payload'

import { revalidateTag } from 'next/cache'

import { checkRole } from '@/access/utilities'
import type { User } from '@/payload-types'
import { generateSampleWorkbook } from '@/lib/productBulkImport/generateSampleWorkbook'
import { parseWorkbook } from '@/lib/productBulkImport/parseWorkbook'
import { processRow, type RowResult } from '@/lib/productBulkImport/processRow'

const forbidden = () => Response.json({ error: 'Forbidden' }, { status: 403 })
const badRequest = (message: string) => Response.json({ error: message }, { status: 400 })

const requireAdmin = (req: { user?: unknown }) => checkRole(['admin'], req.user as User | undefined)

// GET /product-bulk-import/sample — a ready-to-fill .xlsx with the exact columns the upload
// endpoint below expects, plus a couple of example rows and a "Column Guide" sheet.
const sampleEndpoint: Endpoint = {
  path: '/product-bulk-import/sample',
  method: 'get',
  handler: async (req) => {
    if (!requireAdmin(req)) return forbidden()

    const buffer = generateSampleWorkbook()
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="product-bulk-import-sample.xlsx"',
      },
    })
  },
}

// Rows touch the DB one at a time (categories/tags lookups, image downloads, then the product
// write) rather than in parallel — a spreadsheet-driven bulk import isn't latency-sensitive, and
// sequential keeps row-by-row progress/error reporting simple and avoids hammering the DB pool.
const uploadEndpoint: Endpoint = {
  path: '/product-bulk-import',
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
    const buffer = Buffer.from(arrayBuffer)

    const { rows, errors: parseErrors } = parseWorkbook(buffer)

    const results: RowResult[] = parseErrors.map((e) => ({
      rowNumber: e.rowNumber,
      title: '',
      action: 'error',
      message: e.message,
      warnings: [],
    }))

    for (const row of rows) {
      const result = await processRow(req.payload, row)
      results.push(result)
    }

    results.sort((a, b) => a.rowNumber - b.rowNumber)
    req.payload.logger.info('Revalidating products after bulk import')
    revalidateTag('products', 'max')

    return Response.json({
      results,
      createdCount: results.filter((r) => r.action === 'created').length,
      updatedCount: results.filter((r) => r.action === 'updated').length,
      errorCount: results.filter((r) => r.action === 'error').length,
    })
  },
}

export const productBulkImportEndpoints: Endpoint[] = [sampleEndpoint, uploadEndpoint]
