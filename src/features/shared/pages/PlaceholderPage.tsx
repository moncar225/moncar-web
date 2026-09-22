import { EmptyState } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

interface PlaceholderPageProps {
  /** Identifiant de la rubrique du menu (ex. « voyages »). */
  title: string
}

/**
 * Page d'attente d'une rubrique du menu des espaces.
 * ⚠️ UI uniquement : aucune logique métier, aucune donnée — la rubrique sera
 * implémentée quand le contrat OpenAPI correspondant sera disponible.
 */
export function PlaceholderPage({ title }: PlaceholderPageProps) {
  const displayTitle = title.charAt(0).toUpperCase() + title.slice(1)
  useDocumentTitle(`MON CAR — ${displayTitle}`)
  return (
    <EmptyState
      title={`Interface « ${displayTitle} » à venir`}
      message="Cette rubrique du menu est en place (structure UI uniquement). Sa logique métier sera branchée sur le backend MON CAR dès que le contrat OpenAPI correspondant sera disponible."
    />
  )
}
