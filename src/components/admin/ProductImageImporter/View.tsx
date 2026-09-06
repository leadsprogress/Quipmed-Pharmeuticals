import type { AdminViewServerProps } from 'payload'

import { DefaultTemplate } from '@payloadcms/ui/rsc'
import { Gutter } from '@payloadcms/ui'
import React from 'react'

import { checkRole } from '@/access/utilities'
import type { User } from '@/payload-types'
import { ProductImageImporterApp } from './App'
import './index.css'

export const ProductImageImporterView: React.FC<AdminViewServerProps> = (props) => {
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
      <Gutter className="product-image-importer-view">
        <h1>Product Image Importer</h1>
        <p className="product-image-importer-view__intro">
          Import product photos from a PDF catalog — one product per page. Dry-run by default; you
          review and approve before anything is written to a product.
        </p>
        {isAdmin ? (
          <ProductImageImporterApp />
        ) : (
          <p className="product-image-importer-view__forbidden">You do not have access to this page.</p>
        )}
      </Gutter>
    </DefaultTemplate>
  )
}
