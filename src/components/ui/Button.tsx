import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = orange (CTA/actus) · secondary = bleu MON CAR. */
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  isLoading?: boolean
  children: ReactNode
}

/**
 * Bouton du Design System MON CAR.
 * Variantes : primary (orange, action principale), secondary (bleu),
 * outline, ghost, danger. États : default/hover/active/focus/disabled/loading.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', isLoading = false, disabled, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={['mc-btn', `mc-btn--${variant}`, size === 'sm' ? 'mc-btn--sm' : '']
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {isLoading && (
        <span className="mc-button-spinner" aria-hidden="true">
          <Spinner size="sm" />
        </span>
      )}
      {children}
    </button>
  )
})
