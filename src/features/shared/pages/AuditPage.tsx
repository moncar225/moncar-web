import { AuditPanel } from '@/features/shared/components/AuditPanel'
import { PageHeader } from '@/features/shared/components/Page'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/** Journal d'audit (écriture seule côté serveur, consultation filtrée par permission). */
export default function AuditPage() {
  useDocumentTitle('MON CAR — Journal d’audit')
  return (
    <>
      <PageHeader
        title="Journal d’audit"
        description="Chaque opération sensible : auteur, heure, valeur avant et après. Aucune entrée ne peut être modifiée."
      />
      <AuditPanel />
    </>
  )
}
