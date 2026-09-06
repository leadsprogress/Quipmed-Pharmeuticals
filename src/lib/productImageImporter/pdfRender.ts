import { Canvas, createCanvas } from '@napi-rs/canvas'

// pdfjs-dist's legacy Node build expects a `path2d`-free canvas factory; @napi-rs/canvas's
// CanvasRenderingContext2D implements the subset pdf.js actually calls (fill/stroke/drawImage/
// text), so we hand it a small factory shim instead of pulling in the classic `canvas` package
// (which needs node-gyp + system libs and is a known pain to build on Windows).
// drizzle-kit (loaded by @payloadcms/db-postgres for dev schema push) monkey-patches an
// enumerable `Array.prototype.random` for the lifetime of this Node process. pdf.js has a
// defensive startup check that throws UnknownErrorException the moment it sees any enumerable
// property polluting Array.prototype — strip it right before touching pdf.js.
function cleanArrayPrototypePollution() {
  if (Object.prototype.hasOwnProperty.call(Array.prototype, 'random')) {
    delete (Array.prototype as unknown as Record<string, unknown>).random
  }
}

async function getPdfjs() {
  cleanArrayPrototypePollution()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - no bundled types for the legacy Node build's mjs entry
  return import('pdfjs-dist/legacy/build/pdf.mjs')
}

class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(width, height)
    const context = canvas.getContext('2d')
    return { canvas, context }
  }

  reset(canvasAndContext: { canvas: Canvas }, width: number, height: number) {
    canvasAndContext.canvas.width = width
    canvasAndContext.canvas.height = height
  }

  destroy(canvasAndContext: { canvas: Canvas | null }) {
    canvasAndContext.canvas = null
  }
}

export async function getPdfPageCount(pdfBuffer: Buffer): Promise<number> {
  const pdfjs = await getPdfjs()
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) })
  const doc = await loadingTask.promise
  const count = doc.numPages
  await loadingTask.destroy()
  return count
}

// Renders at a high enough DPI (scale ~2.5x of the PDF's native 72dpi -> ~180dpi) that packaging
// text and product-image boundaries stay legible to Claude, without producing PNGs so large they
// blow past reasonable request sizes across an ~80-page run.
const RENDER_SCALE = 2.5

export async function renderPdfPageToPng(
  pdfBuffer: Buffer,
  pageNumber: number,
): Promise<{ png: Buffer; width: number; height: number }> {
  const pdfjs = await getPdfjs()
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) })
  const doc = await loadingTask.promise
  try {
    const page = await doc.getPage(pageNumber)
    const viewport = page.getViewport({ scale: RENDER_SCALE })

    const factory = new NodeCanvasFactory()
    const { canvas, context } = factory.create(Math.ceil(viewport.width), Math.ceil(viewport.height))

    await page.render({
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
      canvas: canvas as unknown as HTMLCanvasElement,
    }).promise

    const png = canvas.toBuffer('image/png')
    return { png, width: canvas.width, height: canvas.height }
  } finally {
    await loadingTask.destroy()
  }
}
