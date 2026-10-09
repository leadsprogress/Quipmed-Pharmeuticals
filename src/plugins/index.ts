import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { Plugin } from 'payload'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'


import { codAdapter } from '@/payments/codAdapter'
import { payuAdapter } from '@/payments/payuAdapter'
import { upiManualAdapter } from '@/payments/upiManualAdapter'

import { Page, Product } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { ProductsCollection } from '@/collections/Products'
import { fulfillmentFields } from '@/collections/Orders/fields/fulfillment'
import { syncFulfillmentStatus } from '@/collections/Orders/hooks/syncFulfillmentStatus'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { customerOnlyFieldAccess } from '@/access/customerOnlyFieldAccess'
import { isAdmin } from '@/access/isAdmin'
import { isDocumentOwner } from '@/access/isDocumentOwner'

const generateTitle: GenerateTitle<Product | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Amulya Medicals` : 'Amulya Medicals'
}

const generateURL: GenerateURL<Product | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formSubmissionOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
      },
      admin: {
        group: 'Content',
      },
    },
    formOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
        create: isAdmin,
      },
      admin: {
        group: 'Content',
      },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  ecommercePlugin({
    access: {
      adminOnlyFieldAccess,
      adminOrPublishedStatus,
      customerOnlyFieldAccess,
      isAdmin,
      isDocumentOwner,
    },
    currencies: {
      defaultCurrency: 'INR',
      supportedCurrencies: [
        {
          code: 'INR',
          decimals: 2,
          label: 'Indian Rupee',
          symbol: '₹',
          symbolDisplay: 'symbol',
        },
      ],
    },
    customers: {
      slug: 'users',
    },
    orders: {
      ordersCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        admin: {
          ...defaultCollection.admin,
          defaultColumns: [
            'createdAt',
            'customerEmail',
            'paymentMethod',
            'paymentReviewStatus',
            'status',
            'amount',
          ],
        },
        fields: [
          ...defaultCollection.fields,
          {
            name: 'accessToken',
            type: 'text',
            unique: true,
            index: true,
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
            hooks: {
              beforeValidate: [
                ({ value, operation }) => {
                  if (operation === 'create' || !value) {
                    return crypto.randomUUID()
                  }
                  return value
                },
              ],
            },
          },
          // A plain copy of the triggering transaction's paymentMethod, written by the payment
          // adapters at order-creation time. Orders don't otherwise carry this directly (only
          // their related Transactions do), and reading it off a relationship from an admin
          // condition/custom field is awkward — this keeps it a one-hop lookup everywhere.
          {
            name: 'paymentMethod',
            type: 'text',
            admin: { position: 'sidebar', readOnly: true },
          },
          {
            name: 'paymentReviewStatus',
            type: 'select',
            options: [
              { label: 'Pending verification', value: 'pending' },
              { label: 'Approved', value: 'approved' },
            ],
            admin: {
              position: 'sidebar',
              description:
                'Manual-UPI orders only — approve once you’ve matched the WhatsApp screenshot to this order in your own UPI app.',
              condition: (data) => data?.paymentMethod === 'upi_manual',
              components: {
                Field: '@/components/admin/ApproveUpiPayment#ApproveUpiPayment',
              },
            },
          },
          ...fulfillmentFields,
        ],
        hooks: {
          ...defaultCollection.hooks,
          beforeChange: [...(defaultCollection.hooks?.beforeChange || []), syncFulfillmentStatus],
        },
      }),
    },
    transactions: {
      transactionsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        admin: {
          ...defaultCollection.admin,
          defaultColumns: ['createdAt', 'customer', 'order', 'paymentMethod', 'amount', 'status'],
        },
      }),
    },
    payments: {
      paymentMethods: [
        // Registered but hidden from checkout (see CheckoutPage.tsx / NEXT_PUBLIC_PAYU_ENABLED)
        // while the PayU account is mid-KYC — left wired up so switching it back on is a single
        // env var, not a rebuild of this integration.
        payuAdapter(),
        upiManualAdapter(),
        codAdapter(),
      ],
    },
    products: {
      productsCollectionOverride: ProductsCollection,
      variants: {
        variantTypesCollectionOverride: ({ defaultCollection }) => ({
          ...defaultCollection,
          admin: { ...defaultCollection.admin, group: 'Ecommerce' },
        }),
        variantOptionsCollectionOverride: ({ defaultCollection }) => ({
          ...defaultCollection,
          admin: { ...defaultCollection.admin, group: 'Ecommerce' },
        }),
        variantsCollectionOverride: ({ defaultCollection }) => ({
          ...defaultCollection,
          admin: { ...defaultCollection.admin, group: 'Ecommerce' },
        }),
      },
    },
  }),
]
