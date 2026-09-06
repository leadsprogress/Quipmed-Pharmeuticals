import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

// Tracks PDF-catalog image-import jobs (see src/lib/productImageImporter). Deliberately separate
// from `products` — this collection only records *import state* (per-page status, Claude's
// detections, match results, crop coordinates); it never duplicates product data and the pipeline
// only ever writes back to an existing product's `gallery[0].image` on explicit approval.
export const ProductImageImports: CollectionConfig = {
  slug: 'product-image-imports',
  admin: {
    group: 'Content',
    hidden: true, // only reachable via the Product Image Importer admin view, not the main nav
    useAsTitle: 'filename',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  fields: [
    { name: 'filename', type: 'text', required: true },
    { name: 'pageCount', type: 'number', required: true },
    {
      name: 'tempDir',
      type: 'text',
      required: true,
      admin: { description: 'Local temp directory holding the rendered page PNGs / crop previews for this job.' },
    },
    { name: 'dryRun', type: 'checkbox', defaultValue: true },
    { name: 'allowReplaceExisting', type: 'checkbox', defaultValue: false },
    {
      name: 'jobStatus',
      type: 'select',
      defaultValue: 'pending',
      options: ['pending', 'processing', 'completed', 'failed'],
    },
    {
      name: 'pages',
      type: 'array',
      fields: [
        { name: 'pageNumber', type: 'number', required: true },
        {
          name: 'status',
          type: 'select',
          defaultValue: 'PENDING',
          options: [
            'PENDING',
            'PROCESSING',
            'MATCHED',
            'CROPPED',
            'UPLOADED',
            'COMPLETED',
            'NEEDS_REVIEW',
            'FAILED',
            'SKIPPED',
          ],
        },
        { name: 'detectedProductName', type: 'text' },
        { name: 'composition', type: 'text' },
        { name: 'strength', type: 'text' },
        { name: 'packSize', type: 'text' },
        { name: 'mrp', type: 'text' },
        { name: 'claudeConfidence', type: 'number' },
        { name: 'claudeNotes', type: 'text' },
        {
          name: 'cropBox',
          type: 'group',
          fields: [
            { name: 'present', type: 'checkbox' },
            { name: 'x', type: 'number' },
            { name: 'y', type: 'number' },
            { name: 'width', type: 'number' },
            { name: 'height', type: 'number' },
          ],
        },
        { name: 'pageWidth', type: 'number' },
        { name: 'pageHeight', type: 'number' },
        { name: 'matchedProduct', type: 'relationship', relationTo: 'products' },
        { name: 'matchConfidence', type: 'number' },
        {
          name: 'matchMethod',
          type: 'select',
          options: ['exact_normalized', 'slug', 'fuzzy', 'composition_secondary', 'manual', 'none'],
        },
        {
          name: 'validation',
          type: 'group',
          fields: [
            { name: 'valid', type: 'checkbox' },
            { name: 'confidence', type: 'number' },
            { name: 'reason', type: 'text' },
          ],
        },
        {
          name: 'previousGalleryImage',
          type: 'relationship',
          relationTo: 'media',
          admin: { description: 'Snapshot of gallery[0].image before this import, for revert.' },
        },
        {
          name: 'hadGalleryBeforeImport',
          type: 'checkbox',
          admin: { description: 'Whether the product had any gallery row at all before this import (vs. one being created).' },
        },
        { name: 'uploadedMedia', type: 'relationship', relationTo: 'media' },
        { name: 'imported', type: 'checkbox', defaultValue: false },
        { name: 'error', type: 'text' },
      ],
    },
  ],
}
