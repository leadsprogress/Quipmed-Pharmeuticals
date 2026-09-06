import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs/promises'

async function main() {
  const photoRes = await fetch('http://localhost:3000/api/media/file/pharmacist-assisting-customer-purchase.jpg')
  const photoBytes = new Uint8Array(await photoRes.arrayBuffer())

  const pdf = await PDFDocument.create()
  const helvetica = await pdf.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const photo = await pdf.embedJpg(photoBytes)

  const products = [
    {
      title: 'Dapagotfil 5',
      composition: 'DAPAGLIFLOZIN 5 MG',
      strength: '5 mg',
      packing: '10*10 Tablets',
      mrp: '145',
    },
    {
      title: 'Dapagotfil 10',
      composition: 'DAPAGLIFLOZIN 10 MG',
      strength: '10 mg',
      packing: '10*10 Tablets',
      mrp: '210',
    },
    {
      title: 'Empgotpil 25',
      composition: 'EMPAGLIFLOZIN 25MG',
      strength: '25 mg',
      packing: '10*10 Tablets',
      mrp: '260',
    },
    // Deliberately NOT a real product in the catalog — exercises the NEEDS_REVIEW + manual-match path.
    {
      title: 'Totally Fictional Compound 999',
      composition: 'MADE-UP INGREDIENT 999 MG',
      strength: '999 mg',
      packing: '1*1 Tablets',
      mrp: '999',
    },
  ]

  const width = 595
  const height = 842

  for (const product of products) {
    const page = pdf.addPage([width, height])

    // Decorative background bar (should NOT end up in the crop)
    page.drawRectangle({ x: 0, y: height - 60, width, height: 60, color: rgb(0.1, 0.4, 0.3) })
    page.drawText('AMULYA MEDICALS', { x: 30, y: height - 40, size: 18, font: helveticaBold, color: rgb(1, 1, 1) })

    page.drawText(product.title.toUpperCase(), { x: 40, y: height - 110, size: 26, font: helveticaBold })
    page.drawText(`${product.composition}`, { x: 40, y: height - 140, size: 13, font: helvetica })
    page.drawText(`Strength: ${product.strength}`, { x: 40, y: height - 165, size: 12, font: helvetica })
    page.drawText(`Pack: ${product.packing}`, { x: 40, y: height - 185, size: 12, font: helvetica })
    page.drawText(`MRP Rs. ${product.mrp}`, { x: 40, y: height - 205, size: 14, font: helveticaBold })

    // The actual "product photograph" region — sized to fit well within the page, clear of all
    // text above (photo.scale() on this ~6912x4608 source would still be much taller than the
    // page — target a fixed box instead).
    const targetPhotoWidth = 260
    const photoScaleFactor = targetPhotoWidth / photo.width
    const photoDims = { width: targetPhotoWidth, height: photo.height * photoScaleFactor }
    const photoX = (width - photoDims.width) / 2
    const photoY = 260
    page.drawImage(photo, { x: photoX, y: photoY, width: photoDims.width, height: photoDims.height })

    // Decorative footer shape (should NOT end up in the crop either)
    page.drawRectangle({ x: 0, y: 0, width, height: 40, color: rgb(0.85, 0.85, 0.8) })
    page.drawText('www.amulyamedicals.com', { x: 30, y: 14, size: 10, font: helvetica })
  }

  const bytes = await pdf.save()
  await fs.writeFile(process.argv[2], bytes)
  console.log(`Wrote ${products.length}-page test PDF to ${process.argv[2]}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
