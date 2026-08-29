'use client'

import { gsap } from 'gsap'
import React, { useState } from 'react'

const FIELDS = [
  { name: 'name', label: 'Your Name', type: 'text' },
  { name: 'phone', label: 'Phone Number', type: 'tel' },
  { name: 'email', label: 'Email Address', type: 'email' },
]

function FloatingInput({ name, label, type }: { name: string; label: string; type: string }) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const active = focused || value.length > 0

  return (
    <div className="relative">
      <input
        id={name}
        name={name}
        type={type}
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="peer w-full rounded-xl border border-border bg-background px-4 pb-2 pt-5 text-sm outline-none transition-colors focus:border-primary"
      />
      <label
        htmlFor={name}
        className={`pointer-events-none absolute left-4 transition-all duration-200 ${
          active ? 'top-2 text-xs text-primary' : 'top-1/2 -translate-y-1/2 text-sm text-muted-foreground'
        }`}
      >
        {label}
      </label>
    </div>
  )
}

export const ContactForm: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    // No backend endpoint wired up yet — this is a visual/interaction placeholder.
    setTimeout(() => {
      setStatus('sent')
      gsap.fromTo(
        '[data-contact-success]',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
      )
    }, 700)
  }

  if (status === 'sent') {
    return (
      <div data-contact-success className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
        <i className="fa-solid fa-circle-check text-3xl text-primary" />
        <p className="mt-3 font-semibold">Thanks — we'll get back to you shortly.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          (This form isn't wired to a backend yet — connect it before going live.)
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {FIELDS.map((field) => (
        <FloatingInput key={field.name} {...field} />
      ))}
      <div className="relative">
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          className="peer w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
          placeholder="How can we help?"
        />
      </div>
      <button
        type="submit"
        disabled={status === 'sending'}
        data-cursor-hover
        className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}
