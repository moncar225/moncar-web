import { LitigesPanel } from '@/features/shared/components/LitigesPanel'
import { PageHeader } from '@/features/shared/components/Page'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/** Litiges : instruction et décision par le support PROSOFT, réponses des partenaires. */
export default function LitigesPage() {
  useDocumentTitle('MON CAR — Litiges')
  return (
    <>
      <PageHeader title="Support et litiges" description="Pertes, dommages, retards, contestations de frais : historique complet de chaque dossier." />
      <LitigesPanel />
    </>
  )
}
