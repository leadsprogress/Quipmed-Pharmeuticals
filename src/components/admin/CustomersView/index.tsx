import type { AdminViewServerProps } from 'payload'

import { DefaultTemplate } from '@payloadcms/ui/rsc'
import { Gutter } from '@payloadcms/ui'
import React from 'react'

import { checkRole } from '@/access/utilities'
import type { User } from '@/payload-types'
import { CustomerSearchPanel } from './SearchPanel'
import './index.css'

export const CustomersView: React.FC<AdminViewServerProps> = (props) => {
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
      <Gutter className="customers-view">
        <h1>Customers</h1>
        <p className="customers-view__intro">
          Search by customer name, phone number, email address, or order number. Results update as
          you type.
        </p>
        {isAdmin ? (
          <CustomerSearchPanel />
        ) : (
          <p className="customers-view__forbidden">You do not have access to this page.</p>
        )}
      </Gutter>
    </DefaultTemplate>
  )
}
