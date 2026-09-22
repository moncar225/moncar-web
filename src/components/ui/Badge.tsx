import type { ReactNode } from 'react'

type BadgeVariant = 'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'danger'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
}

/** Badge d'état du Design System MON CAR. */
export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return <span className={`mc-badge mc-badge--${variant}`}>{children}</span>
}
