// Seeds the Payload `pages` collection with real content matching the previously hand-built
// About / Contact / FAQ / Terms / Privacy / Returns routes, so those pages become CMS-editable.
// Safe to re-run: it upserts by slug (updates if a page with that slug already exists).
import { config as loadEnv } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(dirname, '../../.env') })

type LexicalNode = Record<string, unknown>

const heading = (tag: 'h1' | 'h2' | 'h3' | 'h4', text: string): LexicalNode => ({
  type: 'heading',
  tag,
  children: [{ type: 'text', text, version: 1 }],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const paragraph = (text: string): LexicalNode => ({
  type: 'paragraph',
  children: [{ type: 'text', text, version: 1 }],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const richText = (...children: LexicalNode[]) => ({
  root: {
    type: 'root',
    children,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  },
})

const lowImpactHero = (h1: string, subtext?: string) => ({
  type: 'lowImpact' as const,
  richText: subtext ? richText(heading('h1', h1), paragraph(subtext)) : richText(heading('h1', h1)),
})

const contentBlock = (paragraphText: string) => ({
  blockType: 'content' as const,
  columns: [
    {
      size: 'full' as const,
      richText: richText(paragraph(paragraphText)),
    },
  ],
})

async function main() {
  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayload({ config: configPromise })

  const allCategories = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'title',
  })
  const categoryIdByTitle = new Map(allCategories.docs.map((c) => [c.title, c.id]))
  const catId = (title: string) => categoryIdByTitle.get(title)

  const pages: Array<{ slug: string; title: string; data: Record<string, unknown> }> = [
    {
      slug: 'home',
      title: 'Home',
      data: {
        hero: { type: 'none' },
        layout: [
          {
            blockType: 'homeHero',
            eyebrow: 'Your neighbourhood pharmacy, online',
            heading: 'Genuine Products, Delivered to Your Door',
            subtext:
              'Amulya Medicals brings its trusted in-store catalog online — cardiac, diabetic, orthopedic and everyday essentials, delivered fast across Hyderabad.',
            primaryCtaLabel: 'Shop Now',
            primaryCtaUrl: '/shop',
            secondaryCtaLabel: 'Upload Prescription',
            secondaryCtaUrl: '/contact',
            statValue: 290,
            statSuffix: '+',
            statLabel: 'Products in catalog',
            trustItems: [
              { icon: 'fa-shield-heart', title: 'Genuine Products', subtitle: '100% authentic, sourced directly' },
              { icon: 'fa-tag', title: 'Fair Pricing', subtitle: 'Honest prices on every order' },
              { icon: 'fa-truck-fast', title: 'Fast Delivery', subtitle: 'Across Hyderabad in 24-48 hours' },
              { icon: 'fa-credit-card', title: 'Easy Payments', subtitle: 'Secure checkout, multiple options' },
            ],
          },
          {
            blockType: 'categoryShowcase',
            heading: 'Shop by Category',
            subheading: 'Trusted healthcare essentials, sorted the way you shop.',
            categories: allCategories.docs.map((c) => c.id),
          },
          ...(catId('New Launches')
            ? [{ blockType: 'featuredRail' as const, heading: 'New Launches', category: catId('New Launches'), limit: 10 }]
            : []),
          {
            blockType: 'whyChooseUs',
            heading: 'Why Choose Amulya Medicals',
            rows: [
              {
                title: 'Sourced Directly, Never Grey-Market',
                body: 'Every product on our shelves comes straight from authorized distributors — no exceptions.',
                icon: 'fa-shield-heart',
              },
              {
                title: 'Delivered Fast, Tracked Fully',
                body: 'Order before 6pm and get same-day dispatch across Hyderabad, with live tracking on every order.',
                icon: 'fa-truck-fast',
              },
              {
                title: 'A Team That Knows Your Order',
                body: 'Our in-store pharmacists review every prescription upload personally before it ships.',
                icon: 'fa-user-doctor',
              },
            ],
          },
          {
            blockType: 'promoBanner',
            eyebrow: 'Refills made simple',
            heading: 'Never Run Out Of Your Regular Order',
            body: 'Upload your prescription once — our pharmacists keep it on file, so every refill after that is just a tap, no re-explaining required.',
            buttonLabel: 'Upload Prescription',
            buttonUrl: '/contact',
          },
          {
            blockType: 'popularRanges',
            heading: 'Popular Ranges',
            subheading: 'Trusted therapeutic ranges, chosen by our customers.',
            ranges: [
              { label: 'Cardiac Range', category: catId('Cardiac Range'), limit: 8 },
              { label: 'Diabetic Range', category: catId('Diabetic Range'), limit: 8 },
              { label: 'Orthopedic Range', category: catId('Orthopedic Range'), limit: 8 },
            ].filter((r) => r.category),
          },
          {
            blockType: 'healthAndVisit',
            guidesHeading: 'Health & Wellness Guides',
            guides: [
              {
                icon: 'fa-droplet',
                tag: 'Diabetic Care',
                title: 'Managing Diabetes Day to Day',
                excerpt: 'Simple habits — diet, monitoring and timing — that make a real difference.',
              },
              {
                icon: 'fa-heart-pulse',
                tag: 'Cardiac Care',
                title: 'Heart Health After 40',
                excerpt: 'What routine screening actually catches, and why consistency beats intensity.',
              },
              {
                icon: 'fa-file-prescription',
                tag: 'Patient Guide',
                title: 'Reading Your Prescription Correctly',
                excerpt: 'Dosage, timing and interaction warnings — what the label is telling you.',
              },
              {
                icon: 'fa-bone',
                tag: 'Orthopedic Care',
                title: 'Joint Pain: When to See a Doctor',
                excerpt: 'Everyday aches versus warning signs that need an orthopedic consult.',
              },
            ],
            visitHeading: 'Visit Us',
          },
          {
            blockType: 'callToOrder',
            label: 'Place',
            heading: 'Your Order Via',
            phoneLabel: 'Call Us On',
          },
        ],
      },
    },
    {
      slug: 'about',
      title: 'About Us',
      data: {
        hero: lowImpactHero(
          'Built to make healthcare access simpler',
          'Amulya Medicals is a [placeholder: brief company history — how many years in operation] pharmacy based in Bhagyanagar Colony, Hyderabad, now bringing that same catalog and reliability directly to customers online.',
        ),
        layout: [
          {
            blockType: 'stats',
            items: [
              { icon: 'fa-capsules', value: 290, suffix: '+', label: 'Products in catalog' },
              { icon: 'fa-layer-group', value: 15, suffix: '', label: 'Therapeutic ranges' },
              { icon: 'fa-truck-fast', value: 24, suffix: '-48 hrs', label: 'Delivery window' },
              { icon: 'fa-shield-heart', value: 100, suffix: '%', label: 'Genuine, sourced directly' },
            ],
          },
          {
            blockType: 'valueCards',
            items: [
              {
                icon: 'fa-shield-heart',
                title: 'Genuine, Always',
                body: 'Every product we list is sourced directly from authorized distributors — no grey-market stock, ever.',
              },
              {
                icon: 'fa-tag',
                title: 'Fair Pricing',
                body: 'We keep margins transparent so customers get a fair deal on every order.',
              },
              {
                icon: 'fa-truck-fast',
                title: 'Reliable Delivery',
                body: 'Consistent 24-48 hour delivery windows across Hyderabad, tracked from dispatch to doorstep.',
              },
            ],
          },
          {
            blockType: 'timeline',
            items: [
              {
                title: 'Our Story',
                body: '[Placeholder: replace with the real founding story — when Amulya Medicals opened its doors in Bhagyanagar Colony, Hyderabad.]',
              },
              {
                title: 'Building the Catalog',
                body: '[Placeholder: how the in-store range grew — manufacturer partnerships, therapeutic ranges added over time.]',
              },
              {
                title: 'Going Online',
                body: 'Bringing the same trusted, in-store catalog to a wider audience across Hyderabad — genuine products, delivered.',
              },
            ],
          },
        ],
      },
    },
    {
      slug: 'contact',
      title: 'Contact Us',
      data: {
        hero: lowImpactHero(
          "We'd Love to Hear From You",
          "Questions about an order, a prescription upload, or bulk pricing — reach out and we'll get back to you.",
        ),
        layout: [{ blockType: 'contactInfo' }],
      },
    },
    {
      slug: 'faq',
      title: 'FAQ',
      data: {
        hero: lowImpactHero('Frequently Asked Questions'),
        layout: [
          {
            blockType: 'faq',
            items: [
              {
                question: 'How long does delivery take?',
                answer:
                  'Orders placed before 6pm are typically delivered within 24-48 hours across Hyderabad.',
              },
              {
                question: 'Can I upload a prescription?',
                answer:
                  'Yes — use the "Upload Prescription" option and our in-store pharmacists will review it before your order ships.',
              },
              {
                question: 'What payment methods do you accept?',
                answer: 'Secure checkout supports major cards and other common online payment options.',
              },
              {
                question: 'Can I return a product?',
                answer: 'See our Return Policy page for details — [to be finalized with the client].',
              },
              {
                question: 'Do you deliver outside Hyderabad?',
                answer: '[Placeholder — confirm delivery coverage area with the client.]',
              },
            ],
          },
        ],
      },
    },
    {
      slug: 'terms',
      title: 'Terms & Conditions',
      data: {
        hero: lowImpactHero('Terms & Conditions'),
        layout: [
          contentBlock(
            '[Placeholder — standard e-commerce terms and conditions to be drafted/reviewed with the client before this site goes live.]',
          ),
        ],
      },
    },
    {
      slug: 'privacy',
      title: 'Privacy Policy',
      data: {
        hero: lowImpactHero('Privacy Policy'),
        layout: [
          contentBlock(
            '[Placeholder — a privacy policy covering data collection, storage and use needs to be drafted/reviewed with the client before this site goes live.]',
          ),
        ],
      },
    },
    {
      slug: 'returns',
      title: 'Return Policy',
      data: {
        hero: lowImpactHero('Return Policy'),
        layout: [
          contentBlock(
            '[Placeholder — return/refund policy for a pharmacy (subject to real regulatory constraints on returning dispensed medicines) needs to be finalized with the client.]',
          ),
        ],
      },
    },
  ]

  // next/cache's revalidatePath throws outside a real Next.js request context, which a
  // standalone script isn't — disableRevalidate skips that hook body entirely.
  const context = { disableRevalidate: true }

  for (const page of pages) {
    const existing = await payload.find({
      collection: 'pages',
      limit: 1,
      where: { slug: { equals: page.slug } },
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'pages',
        id: existing.docs[0].id,
        data: { title: page.title, _status: 'published', ...page.data },
        context,
      })
      console.log(`Updated: ${page.slug}`)
    } else {
      await payload.create({
        collection: 'pages',
        data: { title: page.title, slug: page.slug, _status: 'published', ...page.data },
        context,
      })
      console.log(`Created: ${page.slug}`)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
