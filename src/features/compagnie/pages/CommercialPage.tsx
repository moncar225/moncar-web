import { useState } from 'react'
import { Tabs } from '@/components/ui'
import { useAuth } from '@/app/providers/AuthProvider'
import { FidelitePanel } from '@/features/shared/components/FidelitePanel'
import { PageHeader } from '@/features/shared/components/Page'
import { PromotionsPanel } from '@/features/shared/components/PromotionsPanel'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/** Service commercial : promotions (validées par PROSOFT) et fidélité compagnie. */
export default function CommercialPage() {
  useDocumentTitle('MON CAR — Commercial')
  const { session } = useAuth()
  const [onglet, setOnglet] = useState('promotions')
  return (
    <>
      <PageHeader title="Commercial" description="Toute promotion est validée par PROSOFT avant diffusion dans l’app client." />
      <Tabs
        ariaLabel="Rubrique commerciale"
        tabs={[
          { id: 'promotions', label: 'Promotions' },
          { id: 'fidelite', label: 'Fidélité' },
        ]}
        active={onglet}
        onChange={setOnglet}
      >
        {onglet === 'promotions' ? (
          <PromotionsPanel cibles={['voyage', 'colis']} />
        ) : (
          <FidelitePanel modifiable={(p) => p.porteurType === 'compagnie' && p.porteurId === session?.compagnie?.id} />
        )}
      </Tabs>
    </>
  )
}
