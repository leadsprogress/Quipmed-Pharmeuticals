import Link from 'next/link'
import React from 'react'

import { getCachedGlobal } from '@/utilities/getGlobals'
import { getWhatsAppUrl } from '@/utilities/getWhatsAppUrl'

export const FloatingContact: React.FC = async () => {
  const footer = await getCachedGlobal('footer', 0)()
  const href = getWhatsAppUrl(footer?.contact?.whatsappNumber)

  return (
    <Link
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      aria-label="Chat with us on WhatsApp"
      data-cursor-hover
      className="fixed bottom-3 right-3 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-300 hover:scale-110 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-40" />
      <i className="fa-brands fa-whatsapp relative text-lg sm:text-2xl" />
    </Link>
  )
}
