import type { ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { Alert, EmptyState, ErrorState, Spinner } from '@/components/ui'
import { isApiError } from '@/api/errors'

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        {description !== undefined && <p>{description}</p>}
      </div>
      {actions !== undefined && <div className="page-header__actions">{actions}</div>}
    </div>
  )
}

/**
 * Message à afficher : le message métier du serveur s'il existe (§11.2 :
 * français, orienté action), sinon le message générique du code HTTP.
 */
export function messageErreur(error: unknown): string {
  if (!isApiError(error)) return 'Une erreur inattendue est survenue.'
  return error.serverMessage ?? error.userMessage
}

/** Message d'erreur API normalisé (message français + référence d'incident). */
export function ApiErrorAlert({ error }: { error: unknown }) {
  if (error === null || error === undefined) return null
  const message = messageErreur(error)
  const incident = isApiError(error) ? error.incidentId : undefined
  return (
    <Alert variant="danger">
      {message}
      {incident !== undefined && <span className="muted"> — référence {incident}</span>}
    </Alert>
  )
}

interface QueryViewProps<T> {
  query: UseQueryResult<T, Error>
  /** Libellé du chargement (« Chargement des voyages… »). */
  loading?: string
  /** Si la fonction renvoie vrai, l'état vide est affiché. */
  isEmpty?: (data: T) => boolean
  empty?: ReactNode
  children: (data: T) => ReactNode
}

/** États standard d'une requête : chargement, erreur (réessayer), vide, données. */
export function QueryView<T>({ query, loading = 'Chargement…', isEmpty, empty, children }: QueryViewProps<T>) {
  if (query.isPending)
    return (
      <div className="mc-loading">
        <Spinner label={loading} />
        <span aria-hidden="true">{loading}</span>
      </div>
    )
  if (query.isError) {
    const err = query.error
    return (
      <ErrorState
        message={messageErreur(err)}
        incidentId={isApiError(err) ? err.incidentId : undefined}
        onRetry={() => void query.refetch()}
      />
    )
  }
  if (isEmpty?.(query.data) === true) return <>{empty ?? <EmptyState title="Aucun élément" />}</>
  return <>{children(query.data)}</>
}
