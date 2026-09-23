// Reverse of plainTextToRichText.ts — flattens a product's Lexical richText description back
// into the same plain-text shape the import column expects (paragraphs separated by a blank
// line), so an exported file can be re-imported without mangling the description.
export function lexicalToPlainText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const root = (value as { root?: { children?: unknown[] } }).root
  if (!root?.children) return ''

  const paragraphs = root.children.map((node) => {
    if (!node || typeof node !== 'object') return ''
    const children = (node as { children?: unknown[] }).children ?? []
    return children
      .map((child) => (child && typeof child === 'object' ? (child as { text?: string }).text ?? '' : ''))
      .join('')
  })

  return paragraphs.filter(Boolean).join('\n\n')
}
