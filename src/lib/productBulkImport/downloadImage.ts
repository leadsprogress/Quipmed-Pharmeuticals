const MAX_IMAGE_BYTES = 15 * 1024 * 1024

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export async function downloadImage(
  url: string,
): Promise<{ data: Buffer; mimetype: string; filename: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
  if (!res.ok) {
    throw new Error(`Fetching image failed with status ${res.status}`)
  }

  const contentType = res.headers.get('content-type')?.split(';')[0].trim().toLowerCase() || ''
  if (!contentType.startsWith('image/')) {
    throw new Error(`URL did not return an image (got "${contentType || 'unknown content type'}")`)
  }

  const arrayBuffer = await res.arrayBuffer()
  if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error(`Image is larger than the ${MAX_IMAGE_BYTES / (1024 * 1024)}MB limit`)
  }

  const extension = EXTENSION_BY_CONTENT_TYPE[contentType] || 'jpg'
  const baseName =
    url
      .split('/')
      .pop()
      ?.split(/[?#]/)[0]
      ?.replace(/[^a-zA-Z0-9._-]/g, '-')
      .slice(0, 60) || `image.${extension}`
  const filename = baseName.includes('.') ? baseName : `${baseName}.${extension}`

  return {
    data: Buffer.from(arrayBuffer),
    mimetype: contentType,
    filename,
  }
}
