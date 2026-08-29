import configPromise from '@payload-config'
import { getPayload } from 'payload'

import './index.css'
import { HeaderClient } from './index.client'

export async function Header() {
  const payload = await getPayload({ config: configPromise })
  const categories = await payload.find({ collection: 'categories', limit: 100, sort: 'title' })

  return <HeaderClient categories={categories.docs} />
}
