import React from 'react'

export const ProductBulkImporterNavLink: React.FC = () => {
  return (
    <div className="nav__link-wrapper">
      <a
        className="nav__link"
        href="/admin/product-bulk-importer"
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        Bulk Import Products
      </a>
    </div>
  )
}
