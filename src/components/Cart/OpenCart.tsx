import clsx from 'clsx'
import React from 'react'

export const OpenCartButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { quantity?: number }
>(function OpenCartButton({ className, quantity, ...rest }, ref) {
  return (
    <button
      ref={ref}
      data-cursor-hover
      className={clsx(
        'relative flex items-center text-foreground transition-colors hover:text-primary',
        className,
      )}
      {...rest}
    >
      <i className="fa-solid fa-bag-shopping text-lg" />
      {quantity ? (
        <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground">
          {quantity}
        </span>
      ) : null}
    </button>
  )
})
