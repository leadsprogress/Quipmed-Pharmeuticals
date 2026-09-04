import React from 'react'

export const CustomersNavLink: React.FC = () => {
  return (
    <div className="nav__link-wrapper">
      <a className="nav__link" href="/admin/customers" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        Customers
      </a>
    </div>
  )
}
