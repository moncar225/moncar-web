import { PageHeader } from '@/features/shared/components/Page'
import { PromotionsPanel } from '@/features/shared/components/PromotionsPanel'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/** Promotions du fournisseur (location), validées par PROSOFT avant diffusion. */
export default function PromotionsBusinessPage() {
  useDocumentTitle('MON CAR — Promotions')
  return (
    <>
      <PageHeader title="Promotions" description="Mettez vos véhicules en avant dans l’app client, après validation par PROSOFT." />
      <PromotionsPanel cibles={['location']} />
    </>
  )
}
