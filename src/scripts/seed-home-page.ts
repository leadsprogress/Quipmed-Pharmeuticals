import { config as loadEnv } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(dirname, '../../.env') })

const heroRichText = {
  root: {
    type: 'root',
    children: [
      {
        type: 'heading',
        tag: 'h1',
        children: [{ type: 'text', text: 'Genuine Medicines, Delivered to Your Door', version: 1 }],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'Trusted pharmaceutical brands across cardiac, diabetic, orthopedic and critical care ranges — sourced directly, priced fairly.',
            version: 1,
          },
        ],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
      },
    ],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  },
}

function archiveSection(heading: string, categoryId: number | string | undefined, limit: number) {
  if (!categoryId) return []
  return [
    {
      blockType: 'archive' as const,
      introContent: {
        root: {
          type: 'root',
          children: [
            {
              type: 'heading',
              tag: 'h2',
              children: [{ type: 'text', text: heading, version: 1 }],
              direction: 'ltr' as const,
              format: '' as const,
              indent: 0,
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
          version: 1,
        },
      } as any,
      populateBy: 'collection' as const,
      relationTo: 'products' as const,
      categories: [categoryId],
      limit,
    },
  ]
}

async function main() {
  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({ collection: 'categories', limit: 100, sort: 'title' })
  const newLaunches = categories.docs.find((c) => c.title === 'New Launches')

  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  })

  const data = {
    title: 'Home',
    slug: 'home',
    _status: 'published' as const,
    hero: {
      // No hero photography provided yet — lowImpact doesn't require an uploaded image.
      // Switch to 'highImpact' once real hero photography is available (see TASKS.md).
      type: 'lowImpact' as const,
      richText: heroRichText as any,
      links: [
        {
          link: {
            type: 'custom' as const,
            appearance: 'default' as const,
            label: 'Shop Now',
            url: '/shop',
          },
        },
      ],
    },
    layout: [
      {
        blockType: 'trustBar' as const,
        items: [
          { title: 'Genuine Medicines', subtitle: '100% authentic, sourced directly' },
          { title: 'Attractive Discounts', subtitle: 'Best prices on every order' },
          { title: 'Timely Delivery', subtitle: 'Delivered in 24-48 hours' },
          { title: 'Easy Payments', subtitle: 'Secure checkout, multiple options' },
        ],
      },
      {
        blockType: 'categoryShowcase' as const,
        heading: 'Shop by Category',
        subheading: 'Trusted medicines and wellness essentials, sorted the way you shop.',
        categories: categories.docs.map((c) => c.id),
      },
      {
        blockType: 'promoTiles' as const,
        tiles: [
          {
            heading: "Don't Just Manage. Save.",
            subheading: 'Compare prices before you buy — genuine medicines at fair rates.',
            tone: 'primary' as const,
            linkLabel: 'Shop Now',
            linkUrl: '/shop',
          },
          {
            heading: 'Bulk & Institutional Orders',
            subheading: 'Pharmacies, clinics and hospitals — get wholesale pricing.',
            tone: 'secondary' as const,
            linkLabel: 'Enquire Now',
            linkUrl: '/find-order',
          },
        ],
      },
      ...archiveSection('New Launches', newLaunches?.id, 8),
      ...archiveSection('Cardiac Range', categories.docs.find((c) => c.title === 'Cardiac Range')?.id, 4),
      ...archiveSection('Diabetic Range', categories.docs.find((c) => c.title === 'Diabetic Range')?.id, 4),
      {
        blockType: 'healthHighlights' as const,
        heading: 'Health & Wellness Guides',
        cards: [
          {
            title: 'Managing Diabetes Day to Day',
            excerpt: 'Simple habits — diet, monitoring and medication timing — that make a real difference.',
            tag: 'Diabetic Care',
          },
          {
            title: 'Heart Health After 40',
            excerpt: 'What routine screening actually catches, and why consistency beats intensity.',
            tag: 'Cardiac Care',
          },
          {
            title: 'Reading Your Prescription Correctly',
            excerpt: 'Dosage, timing and interaction warnings — a quick guide to what the label means.',
            tag: 'Patient Guide',
          },
          {
            title: 'Joint Pain: When to See a Doctor',
            excerpt: 'Everyday aches versus warning signs that need an orthopedic consult.',
            tag: 'Orthopedic Care',
          },
        ],
      },
    ],
  }

  // next/cache's revalidatePath throws outside a real Next.js request context, which a
  // standalone script isn't — disableRevalidate skips that hook body entirely.
  const context = { disableRevalidate: true }

  if (existing.docs[0]) {
    await payload.update({ collection: 'pages', id: existing.docs[0].id, data, context })
    console.log('Updated existing home page:', existing.docs[0].id)
  } else {
    const created = await payload.create({ collection: 'pages', data, context })
    console.log('Created home page:', created.id)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
