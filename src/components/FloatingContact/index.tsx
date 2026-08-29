'use client'

import Link from 'next/link'
import React from 'react'

// No confirmed WhatsApp business number yet — links to Contact for now. Once a real number is
// provided, swap the href for `https://wa.me/91XXXXXXXXXX`.
export const FloatingContact: React.FC = () => {
  return (
    <Link
      href="/contact"
      aria-label="Chat with us on WhatsApp"
      data-cursor-hover
      className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-300 hover:scale-110"
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-40" />
      <i className="fa-brands fa-whatsapp relative text-2xl" />
    </Link>
  )
}
