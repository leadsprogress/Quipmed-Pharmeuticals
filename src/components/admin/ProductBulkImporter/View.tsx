import type { AdminViewServerProps } from 'payload'

import { DefaultTemplate } from '@payloadcms/ui/rsc'
import { Gutter } from '@payloadcms/ui'
import React from 'react'

import { checkRole } from '@/access/utilities'
import type { User } from '@/payload-types'
import { PACK_TYPE_OPTIONS } from '@/lib/productBulkImport/schema'
import { ProductBulkImporterApp } from './App'
import './index.css'

export const ProductBulkImporterView: React.FC<AdminViewServerProps> = async (props) => {
  const { initPageResult, params, searchParams } = props
  const { req, visibleEntities } = initPageResult
  const isAdmin = checkRole(['admin'], req.user as User | undefined)

  const [categories, tags] = isAdmin
    ? await Promise.all([
        req.payload.find({ collection: 'categories', limit: 0, sort: 'title', select: { title: true } }),
        req.payload.find({ collection: 'product-tags', limit: 0, sort: 'label', select: { label: true } }),
      ])
    : [null, null]

  return (
    <DefaultTemplate
      i18n={req.i18n}
      params={params}
      payload={req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={req.user || undefined}
      visibleEntities={visibleEntities}
    >
      <Gutter className="product-bulk-importer-view">
        <h1>Bulk Import Products</h1>
        <p className="product-bulk-importer-view__intro">
          Fill in the sample spreadsheet with your products and drop it here. A row matching an
          existing product's exact Title updates it — only the columns you filled in are changed.
          Anything new is created.
        </p>
        {isAdmin ? (
          <ProductBulkImporterApp
            categories={(categories?.docs ?? []).map((c) => c.title)}
            tags={(tags?.docs ?? []).map((t) => t.label)}
            packTypes={PACK_TYPE_OPTIONS}
          />
        ) : (
          <p className="product-bulk-importer-view__forbidden">You do not have access to this page.</p>
        )}
      </Gutter>
    </DefaultTemplate>
  )
}
