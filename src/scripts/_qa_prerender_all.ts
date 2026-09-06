import fs from 'fs/promises'
import path from 'path'
import { renderPdfPageToPng } from '../lib/productImageImporter/pdfRender'

async function main() {
  const pdfPath = process.argv[2]
  const tempDir = process.argv[3]
  const count = Number(process.argv[4])

  const buf = await fs.readFile(pdfPath)
  await fs.mkdir(path.join(tempDir, 'pages'), { recursive: true })

  for (let n = 1; n <= count; n++) {
    const outPath = path.join(tempDir, 'pages', `page-${String(n).padStart(3, '0')}.png`)
    try {
      await fs.access(outPath)
      continue // already rendered
    } catch {
      // fall through and render
    }
    const { png, width, height } = await renderPdfPageToPng(buf, n)
    await fs.writeFile(outPath, png)
    console.log(`page ${n}: ${width}x${height}`)
  }
  console.log('DONE')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
