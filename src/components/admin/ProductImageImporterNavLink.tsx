import React from 'react'

export const ProductImageImporterNavLink: React.FC = () => {
  return (
    <div className="nav__link-wrapper">
      <a
        className="nav__link"
        href="/admin/product-image-importer"
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        Product Image Importer
      </a>
    </div>
  )
}
