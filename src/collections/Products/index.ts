import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { revalidateProduct, revalidateProductDelete } from './hooks/revalidateProduct'
import { setCompareAtPrice } from './hooks/setCompareAtPrice'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { DefaultDocumentIDType, Where } from 'payload'

export const ProductsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  hooks: {
    ...defaultCollection?.hooks,
    beforeChange: [...(defaultCollection?.hooks?.beforeChange ?? []), setCompareAtPrice],
    afterChange: [...(defaultCollection?.hooks?.afterChange ?? []), revalidateProduct],
    afterDelete: [...(defaultCollection?.hooks?.afterDelete ?? []), revalidateProductDelete],
  },
  admin: {
    ...defaultCollection?.admin,
    defaultColumns: ['title', 'enableVariants', '_status', 'variants.variants'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'products',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'products',
        req,
      }),
    useAsTitle: 'title',
  },
  defaultPopulate: {
    ...defaultCollection?.defaultPopulate,
    title: true,
    slug: true,
    variantOptions: true,
    variants: true,
    enableVariants: true,
    gallery: true,
    priceInINR: true,
    compareAtPrice: true,
    showDiscountBadge: true,
    tags: true,
    inventory: true,
    meta: true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'description',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: false,
              required: false,
            },
            {
              name: 'gallery',
              type: 'array',
              minRows: 1,
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'variantOption',
                  type: 'relationship',
                  relationTo: 'variantOptions',
                  admin: {
                    condition: (data) => {
                      return data?.enableVariants === true && data?.variantTypes?.length > 0
                    },
                  },
                  filterOptions: ({ data }) => {
                    if (data?.enableVariants && data?.variantTypes?.length) {
                      const variantTypeIDs = data.variantTypes.map((item: any) => {
                        if (typeof item === 'object' && item?.id) {
                          return item.id
                        }
                        return item
                      }) as DefaultDocumentIDType[]

                      if (variantTypeIDs.length === 0)
                        return {
                          variantType: {
                            in: [],
                          },
                        }

                      const query: Where = {
                        variantType: {
                          in: variantTypeIDs,
                        },
                      }

                      return query
                    }

                    return {
                      variantType: {
                        in: [],
                      },
                    }
                  },
                },
              ],
            },

            {
              name: 'layout',
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock],
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            ...defaultCollection.fields,
            {
              name: 'compareAtPrice',
              type: 'number',
              min: 0,
              admin: {
                description:
                  'Optional "was" price shown crossed out next to the price on product cards, in paise (e.g. ₹499 = 49900). Leave blank to auto-fill +15% over the price (rounded up to the nearest ₹10) when saved — you can still override it manually at any time.',
              },
            },
            {
              name: 'discountPreview',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/admin/DiscountPreview#DiscountPreview',
                },
              },
            },
            {
              name: 'showDiscountBadge',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'Show the "X% off" badge on this product\'s cards. Also gated by the site-wide toggle in Admin → Settings.',
              },
            },
            {
              name: 'composition',
              type: 'text',
              admin: {
                description: 'Active ingredient / salt composition, e.g. "DAPAGLIFLOZIN 5 MG"',
              },
            },
            {
              name: 'packing',
              type: 'text',
              admin: {
                description: 'e.g. "10*10" (strips per box)',
              },
            },
            {
              name: 'packType',
              type: 'text',
              admin: {
                description: 'e.g. "Tablet", "Injection" — optional',
              },
            },
            {
              name: 'imageUrl',
              type: 'text',
              admin: {
                description:
                  'Temporary hotlinked mock image URL — shown when no real photo is uploaded to the gallery above. Paste any image URL, or leave blank.',
              },
            },
            {
              name: 'relatedProducts',
              type: 'relationship',
              filterOptions: ({ id }) => {
                if (id) {
                  return {
                    id: {
                      not_in: [id],
                    },
                  }
                }

                // ID comes back as undefined during seeding so we need to handle that case
                return {
                  id: {
                    exists: true,
                  },
                }
              },
              hasMany: true,
              relationTo: 'products',
            },
          ],
          label: 'Product Details',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        sortOptions: 'title',
      },
      hasMany: true,
      relationTo: 'categories',
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'product-tags',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Badges shown top-left on this product\'s cards (e.g. "Bestseller", "New").',
      },
    },
    {
      name: 'slug',
      type: 'slug',
      useAsSlug: 'title',
    },
  ],
})
