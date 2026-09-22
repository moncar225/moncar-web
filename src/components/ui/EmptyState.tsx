import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  message?: string
  icon?: ReactNode
  /** Action proposée (ex. « Réinitialiser la recherche »). */
  action?: ReactNode
}

/** État vide du Design System MON CAR : aucune donnée à afficher. */
export function EmptyState({ title, message, icon, action }: EmptyStateProps) {
  return (
    <div className="mc-state">
      {icon !== undefined && (
        <span className="mc-state__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <h3 className="mc-state__title">{title}</h3>
      {message !== undefined && <p className="mc-state__message">{message}</p>}
      {action}
    </div>
  )
}
