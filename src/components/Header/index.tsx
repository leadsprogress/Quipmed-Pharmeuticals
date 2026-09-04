import { getCachedGlobal } from '@/utilities/getGlobals'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import './index.css'
import { HeaderClient } from './index.client'

export async function Header() {
  const payload = await getPayload({ config: configPromise })
  const [categories, header] = await Promise.all([
    payload.find({ collection: 'categories', limit: 100, sort: 'title' }),
    getCachedGlobal('header', 2)(),
  ])

  return <HeaderClient categories={categories.docs} header={header} />
}
