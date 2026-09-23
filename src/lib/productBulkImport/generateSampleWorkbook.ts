import * as XLSX from 'xlsx'

import { COLUMN_NOTES, COLUMN_ORDER, SAMPLE_ROWS } from './schema'

// Built from the same COLUMNS/SAMPLE_ROWS constants the parser reads, so the sample file an admin
// downloads can never drift out of sync with what an upload is actually expected to contain.
export function generateSampleWorkbook(): Buffer {
  const sheet = XLSX.utils.json_to_sheet(SAMPLE_ROWS, { header: COLUMN_ORDER })
  sheet['!cols'] = COLUMN_ORDER.map((header) => ({ wch: Math.max(header.length + 2, 18) }))

  const notesRows = COLUMN_ORDER.map((header) => [header, COLUMN_NOTES[header] ?? ''])
  const notesSheet = XLSX.utils.aoa_to_sheet([['Column', 'Notes'], ...notesRows])
  notesSheet['!cols'] = [{ wch: 28 }, { wch: 90 }]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Products')
  XLSX.utils.book_append_sheet(workbook, notesSheet, 'Column Guide')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}
