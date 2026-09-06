import fs from 'fs/promises'
import { getPdfPageCount, renderPdfPageToPng } from '../lib/productImageImporter/pdfRender'

async function main() {
  const pdfPath = process.argv[2]
  const buf = await fs.readFile(pdfPath)
  const count = await getPdfPageCount(buf)
  console.log('PAGE_COUNT=' + count)

  for (const n of [1, 2, 3]) {
    if (n > count) break
    const { png, width, height } = await renderPdfPageToPng(buf, n)
    const out = process.argv[3] + `/real-page-${n}.png`
    await fs.writeFile(out, png)
    console.log(`Rendered page ${n}: ${width}x${height} -> ${out}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
