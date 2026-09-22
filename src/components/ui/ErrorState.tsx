import { Button } from './Button'
import type { ReactNode } from 'react'

interface ErrorStateProps {
  title?: string
  /** Message en français (voir la logique d'erreurs API commune). */
  message: string
  onRetry?: () => void
  /** Référence d'incident serveur (erreur 500), si fournie par l'API. */
  incidentId?: string
  icon?: ReactNode
}

/** État d'erreur du Design System MON CAR. */
export function ErrorState({
  title = 'Une erreur est survenue',
  message,
  onRetry,
  incidentId,
  icon,
}: ErrorStateProps) {
  return (
    <div className="mc-state mc-state--error" role="alert">
      {icon !== undefined && (
        <span className="mc-state__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <h3 className="mc-state__title">{title}</h3>
      <p className="mc-state__message">{message}</p>
      {incidentId !== undefined && <p className="mc-state__incident">Référence incident : {incidentId}</p>}
      {onRetry !== undefined && (
        <Button variant="outline" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  )
}
