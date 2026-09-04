'use client'

import { gsap } from 'gsap'
import React, { useRef, useState } from 'react'

const DEFAULT_FAQS = [
  {
    q: 'How long does delivery take?',
    a: 'Orders placed before 6pm are typically delivered within 24-48 hours across Hyderabad.',
  },
  {
    q: 'Can I upload a prescription?',
    a: 'Yes — use the "Upload Prescription" option and our in-store pharmacists will review it before your order ships.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Secure checkout supports major cards and other common online payment options.',
  },
  {
    q: 'Can I return a product?',
    a: 'See our Return Policy page for details — [to be finalized with the client].',
  },
  {
    q: 'Do you deliver outside Hyderabad?',
    a: '[Placeholder — confirm delivery coverage area with the client.]',
  },
]

function AccordionItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const toggle = () => {
    const el = contentRef.current
    if (!el) return
    if (!open) {
      gsap.set(el, { height: 'auto' })
      const h = el.offsetHeight
      gsap.fromTo(el, { height: 0 }, { height: h, duration: 0.35, ease: 'power2.out' })
    } else {
      gsap.to(el, { height: 0, duration: 0.3, ease: 'power2.in' })
    }
    setOpen(!open)
  }

  return (
    <div className="border-b border-border">
      <button
        onClick={toggle}
        data-cursor-hover
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-medium">{q}</span>
        <i
          className={`fa-solid fa-chevron-down shrink-0 text-primary transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div ref={contentRef} className="h-0 overflow-hidden">
        <p className="pb-5 text-sm text-muted-foreground">{a}</p>
      </div>
    </div>
  )
}

type Props = {
  items?: { question: string; answer: string }[]
}

export const Accordion: React.FC<Props> = ({ items }) => {
  const faqs =
    items && items.length > 0 ? items.map((i) => ({ q: i.question, a: i.answer })) : DEFAULT_FAQS

  return (
    <div>
      {faqs.map((faq, i) => (
        <AccordionItem key={faq.q} q={faq.q} a={faq.a} index={i} />
      ))}
    </div>
  )
}
