import { AuthProvider } from '@/providers/Auth'
import { EcommerceProvider } from '@payloadcms/plugin-ecommerce/client/react'
import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { SonnerProvider } from '@/providers/Sonner'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HeaderThemeProvider>
          <SonnerProvider />
          <EcommerceProvider
            enableVariants={true}
            currenciesConfig={{
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
            }}
            api={{
              cartsFetchQuery: {
                depth: 2,
                populate: {
                  products: {
                    slug: true,
                    title: true,
                    gallery: true,
                    inventory: true,
                  },
                  variants: {
                    title: true,
                    inventory: true,
                  },
                },
              },
            }}
            paymentMethods={[
              { name: 'payu', label: 'PayU (UPI, Cards, Netbanking)', initiatePayment: true, confirmOrder: true },
              { name: 'cod', label: 'Cash on Delivery', initiatePayment: true, confirmOrder: true },
            ]}
          >
            {children}
          </EcommerceProvider>
        </HeaderThemeProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
