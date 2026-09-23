import ExcelJS from 'exceljs'

import { COLUMN_NOTES, COLUMN_ORDER, COLUMNS, PACK_TYPE_OPTIONS, SAMPLE_ROWS, STATUS_OPTIONS } from './schema'

// How many blank rows below the sample data still get the dropdown/validation applied, so an
// owner adding their own rows keeps the same assistance without needing to copy formatting.
const VALIDATED_ROW_COUNT = 500

type LiveOptions = {
  categoryTitles: string[]
  tagLabels: string[]
}

function columnIndex(header: (typeof COLUMNS)[keyof typeof COLUMNS]): number {
  return COLUMN_ORDER.indexOf(header) + 1
}

// Excel's inline list validation ("Value1,Value2,...") is capped at 255 characters, which a
// real category/tag list can exceed — so dynamic lists are written to a hidden helper sheet and
// referenced by range instead of inlined, while the small fixed lists (Status, Pack Type) are
// inlined directly since they're always well under that limit.
function addListValidation(
  worksheet: ExcelJS.Worksheet,
  header: (typeof COLUMNS)[keyof typeof COLUMNS],
  formulae: string[],
  options: { strict: boolean },
) {
  const col = columnIndex(header)
  for (let row = 2; row <= VALIDATED_ROW_COUNT + 1; row++) {
    worksheet.getCell(row, col).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae,
      showErrorMessage: true,
      errorStyle: options.strict ? 'error' : 'warning',
      error: options.strict
        ? 'Please pick a value from the dropdown list.'
        : 'This column normally holds one dropdown value at a time — separate multiple values with commas if you mean to enter more than one.',
    }
  }
}

// Built from the same COLUMNS/SAMPLE_ROWS constants the parser reads, so the sample file an admin
// downloads can never drift out of sync with what an upload is actually expected to contain.
export async function generateSampleWorkbook({ categoryTitles, tagLabels }: LiveOptions): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()

  const sheet = workbook.addWorksheet('Products')
  sheet.columns = COLUMN_ORDER.map((header) => ({ header, key: header, width: Math.max(header.length + 2, 18) }))
  SAMPLE_ROWS.forEach((row) => sheet.addRow(row))

  // Hidden helper sheet holding the dynamic dropdown source lists (categories/tags) — referenced
  // by range from the Products sheet's data validation rather than inlined.
  const listsSheet = workbook.addWorksheet('Lists')
  listsSheet.state = 'veryHidden'
  categoryTitles.forEach((title, i) => {
    listsSheet.getCell(i + 1, 1).value = title
  })
  tagLabels.forEach((label, i) => {
    listsSheet.getCell(i + 1, 2).value = label
  })

  if (categoryTitles.length > 0) {
    addListValidation(sheet, COLUMNS.categories, [`Lists!$A$1:$A$${categoryTitles.length}`], {
      strict: false,
    })
  }
  if (tagLabels.length > 0) {
    addListValidation(sheet, COLUMNS.tags, [`Lists!$B$1:$B$${tagLabels.length}`], { strict: false })
  }
  addListValidation(sheet, COLUMNS.status, [`"${STATUS_OPTIONS.join(',')}"`], { strict: true })
  addListValidation(sheet, COLUMNS.packType, [`"${PACK_TYPE_OPTIONS.join(',')}"`], { strict: true })

  const guideSheet = workbook.addWorksheet('Column Guide')
  guideSheet.columns = [
    { header: 'Column', key: 'column', width: 28 },
    { header: 'Notes', key: 'notes', width: 100 },
  ]
  COLUMN_ORDER.forEach((header) => {
    guideSheet.addRow({ column: header, notes: COLUMN_NOTES[header] ?? '' })
  })

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
