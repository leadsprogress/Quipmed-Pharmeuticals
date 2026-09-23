import type { AdminViewServerProps } from 'payload'

import { DefaultTemplate } from '@payloadcms/ui/rsc'
import { Gutter } from '@payloadcms/ui'
import React from 'react'

import { checkRole } from '@/access/utilities'
import type { User } from '@/payload-types'
import { ProductBulkImporterApp } from './App'
import './index.css'

export const ProductBulkImporterView: React.FC<AdminViewServerProps> = (props) => {
  const { initPageResult, params, searchParams } = props
  const { req, visibleEntities } = initPageResult
  const isAdmin = checkRole(['admin'], req.user as User | undefined)

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
          Fill in the sample spreadsheet with your products and drop it here. Existing products
          (matched by Slug, or by an exact Title match) are updated — only the columns you filled
          in are changed. Anything new is created.
        </p>
        {isAdmin ? (
          <ProductBulkImporterApp />
        ) : (
          <p className="product-bulk-importer-view__forbidden">You do not have access to this page.</p>
        )}
      </Gutter>
    </DefaultTemplate>
  )
}
