import type { Payload } from 'payload'

import type { ParsedRow } from './schema'
import { downloadImage } from './downloadImage'
import { plainTextToRichText } from './plainTextToRichText'

export type RowResult = {
  rowNumber: number
  title: string
  action: 'created' | 'updated' | 'error'
  message: string
  warnings: string[]
}

async function resolveCategoryIds(
  payload: Payload,
  names: string[],
  warnings: string[],
): Promise<number[]> {
  const ids: number[] = []
  for (const name of names) {
    const result = await payload.find({
      collection: 'categories',
      where: { title: { like: name } },
      limit: 5,
      overrideAccess: true,
    })
    const exact = result.docs.find((doc) => doc.title.toLowerCase() === name.toLowerCase())
    if (exact) {
      ids.push(exact.id as number)
    } else {
      warnings.push(`Category "${name}" doesn't match any existing category — skipped.`)
    }
  }
  return ids
}

async function resolveTagIds(payload: Payload, labels: string[]): Promise<number[]> {
  const ids: number[] = []
  for (const label of labels) {
    const result = await payload.find({
      collection: 'product-tags',
      where: { label: { like: label } },
      limit: 5,
      overrideAccess: true,
    })
    const exact = result.docs.find((doc) => doc.label.toLowerCase() === label.toLowerCase())
    if (exact) {
      ids.push(exact.id as number)
      continue
    }
    const created = await payload.create({
      collection: 'product-tags',
      data: { label } as any,
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
    ids.push(created.id as number)
  }
  return ids
}

async function resolveRelatedProductIds(
  payload: Payload,
  titles: string[],
  warnings: string[],
): Promise<number[]> {
  const ids: number[] = []
  for (const title of titles) {
    const result = await payload.find({
      collection: 'products',
      where: { title: { like: title } },
      limit: 5,
      overrideAccess: true,
    })
    const exact = result.docs.find((doc) => doc.title.toLowerCase() === title.toLowerCase())
    if (exact) {
      ids.push(exact.id as number)
    } else {
      warnings.push(`Related product "${title}" doesn't match any existing product — skipped.`)
    }
  }
  return ids
}

async function resolveGallery(
  payload: Payload,
  imageUrls: string[],
  title: string,
  warnings: string[],
): Promise<{ image: number }[]> {
  const gallery: { image: number }[] = []
  for (const [index, url] of imageUrls.entries()) {
    try {
      const { data, mimetype, filename } = await downloadImage(url)
      const media = await payload.create({
        collection: 'media',
        data: { alt: imageUrls.length > 1 ? `${title} (${index + 1})` : title },
        file: { data, mimetype, name: filename, size: data.length },
        overrideAccess: true,
        context: { disableRevalidate: true },
      })
      gallery.push({ image: media.id as number })
    } catch (err) {
      warnings.push(
        `Image URL ${index + 1} failed (${url}): ${err instanceof Error ? err.message : 'unknown error'}`,
      )
    }
  }
  return gallery
}

export async function processRow(payload: Payload, row: ParsedRow): Promise<RowResult> {
  const warnings: string[] = []

  try {
    const existing = row.slug
      ? await payload.find({
          collection: 'products',
          where: { slug: { equals: row.slug } },
          limit: 1,
          overrideAccess: true,
        })
      : await payload.find({
          collection: 'products',
          where: { title: { equals: row.title } },
          limit: 1,
          overrideAccess: true,
        })

    const existingProduct = existing.docs[0]
    const isUpdate = Boolean(existingProduct)

    if (row.slug && !existingProduct) {
      warnings.push(`No existing product found with slug "${row.slug}" — creating a new product instead.`)
    }

    const categoryIds =
      row.categories.length > 0 ? await resolveCategoryIds(payload, row.categories, warnings) : undefined
    const tagIds = row.tags.length > 0 ? await resolveTagIds(payload, row.tags) : undefined
    const gallery =
      row.imageUrls.length > 0
        ? await resolveGallery(payload, row.imageUrls, row.title, warnings)
        : undefined
    const relatedProductIds =
      row.relatedProducts.length > 0
        ? await resolveRelatedProductIds(payload, row.relatedProducts, warnings)
        : undefined

    if (!isUpdate && (!gallery || gallery.length === 0)) {
      return {
        rowNumber: row.rowNumber,
        title: row.title,
        action: 'error',
        message: 'New products need at least one working Image URL.',
        warnings,
      }
    }

    const data: Record<string, unknown> = {
      title: row.title,
      priceInINR: Math.round(row.priceInRupees * 100),
      _status: row.status,
    }
    if (row.description) data.description = plainTextToRichText(row.description)
    if (row.composition) data.composition = row.composition
    if (row.packing) data.packing = row.packing
    if (row.packType) data.packType = row.packType
    if (categoryIds) data.categories = categoryIds
    if (tagIds) data.tags = tagIds
    if (typeof row.compareAtPriceInRupees === 'number') {
      data.compareAtPrice = Math.round(row.compareAtPriceInRupees * 100)
    }
    if (typeof row.discountPercent === 'number') data.discountPercent = row.discountPercent
    if (typeof row.showDiscountBadge === 'boolean') data.showDiscountBadge = row.showDiscountBadge
    if (typeof row.inventory === 'number') data.inventory = row.inventory
    if (gallery) data.gallery = gallery
    if (relatedProductIds) data.relatedProducts = relatedProductIds
    if (row.metaTitle || row.metaDescription) {
      // A group field like `meta` is replaced wholesale on update, not deep-merged — start from
      // whatever the product already has (e.g. an SEO image) so filling in just one of these two
      // columns doesn't blank out the other meta fields.
      const existingMeta = (isUpdate && existingProduct?.meta) || {}
      data.meta = {
        ...existingMeta,
        ...(row.metaTitle ? { title: row.metaTitle } : {}),
        ...(row.metaDescription ? { description: row.metaDescription } : {}),
      }
    }

    if (isUpdate && existingProduct) {
      await payload.update({
        collection: 'products',
        id: existingProduct.id,
        data: data as any,
        overrideAccess: true,
        context: { disableRevalidate: true },
      })
      return { rowNumber: row.rowNumber, title: row.title, action: 'updated', message: 'Updated existing product.', warnings }
    }

    await payload.create({
      collection: 'products',
      data: data as any,
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
    return { rowNumber: row.rowNumber, title: row.title, action: 'created', message: 'Created new product.', warnings }
  } catch (err) {
    return {
      rowNumber: row.rowNumber,
      title: row.title,
      action: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
      warnings,
    }
  }
}
