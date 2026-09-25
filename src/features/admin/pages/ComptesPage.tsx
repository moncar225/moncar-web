import { ComptesPanel } from '@/features/shared/components/ComptesPanel'
import { PageHeader } from '@/features/shared/components/Page'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/** Comptes et rôles de la plateforme PROSOFT (7 postes Super Admin). */
export default function ComptesPage() {
  useDocumentTitle('MON CAR — Comptes et rôles')
  return (
    <>
      <PageHeader
        title="Comptes et rôles PROSOFT"
        description="Chaque poste donne un ensemble de permissions ; la double authentification est obligatoire pour tous les comptes PROSOFT."
      />
      <ComptesPanel espace="admin" />
    </>
  )
}
