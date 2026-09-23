// Converts a plain-text spreadsheet cell into the Lexical richText shape Products.description
// expects — one paragraph per blank-line-separated block, matching how seed-product-content.ts's
// generated descriptions are shaped.
export function plainTextToRichText(text: string) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  const children = (paragraphs.length > 0 ? paragraphs : [text.trim()]).map((paragraphText) => ({
    type: 'paragraph',
    children: [{ type: 'text', text: paragraphText, version: 1 }],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  }))

  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}
