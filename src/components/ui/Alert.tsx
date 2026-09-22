import type { ReactNode } from 'react'

type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: ReactNode
}

/** Alerte du Design System MON CAR (information, succès, avertissement, erreur). */
export function Alert({ variant = 'info', title, children }: AlertProps) {
  const role = variant === 'danger' ? 'alert' : 'status'
  return (
    <div className={`mc-alert mc-alert--${variant}`} role={role}>
      <div>
        {title !== undefined && <p className="mc-alert__title">{title}</p>}
        {children}
      </div>
    </div>
  )
}
