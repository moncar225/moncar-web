import { useState } from 'react'
import { Alert, Button, Card, Input, Select, useToast } from '@/components/ui'
import type { ParametresPlateforme } from '@/domain/types'
import { FidelitePanel } from '@/features/shared/components/FidelitePanel'
import { ApiErrorAlert, PageHeader, QueryView } from '@/features/shared/components/Page'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useModifierParametres, useParametresPlateforme } from '@/services/plateforme'

/** Paramètres de la plateforme : commissions, frais, blocage de siège (A-4, T-9) et fidélité MON CAR. */
export default function ParametresPlateformePage() {
  useDocumentTitle('MON CAR — Paramètres plateforme')
  const parametres = useParametresPlateforme()
  return (
    <>
      <PageHeader
        title="Paramètres de la plateforme"
        description="Modifiables sans code ; chaque modification est journalisée (avant / après)."
      />
      <div className="stack">
        <QueryView query={parametres} loading="Paramètres…">
          {(p) => <Formulaire parametres={p} />}
        </QueryView>
        <FidelitePanel modifiable={(p) => p.porteurType === 'moncar'} />
      </div>
    </>
  )
}

function Formulaire({ parametres }: { parametres: ParametresPlateforme }) {
  const modifier = useModifierParametres()
  const { showToast } = useToast()
  const [f, setF] = useState(parametres)
  const num = (cle: keyof ParametresPlateforme) => (e: { target: { value: string } }) =>
    setF({ ...f, [cle]: Number(e.target.value) })
  return (
    <Card title="Commissions et frais">
      <Alert variant="warning">
        Valeurs de travail : taux de commission et frais à arbitrer par la direction (A-4), durée de blocage (T-9).
      </Alert>
      <div className="form-grid">
        <Input label="Commission sur les billets (%)" type="number" min={0} max={30} step={0.5} value={f.commissionVoyagePct} onChange={num('commissionVoyagePct')} />
        <Input label="Frais d’opération par billet (F)" type="number" min={0} step={50} value={f.fraisOperationVoyage} onChange={num('fraisOperationVoyage')} />
        <Input label="Frais d’opération par colis (F)" type="number" min={0} step={50} value={f.fraisOperationColis} onChange={num('fraisOperationColis')} />
        <Input label="Commission sur la location (%)" type="number" min={0} max={30} step={0.5} value={f.commissionLocationPct} onChange={num('commissionLocationPct')} />
        <Input label="Blocage d’un siège pendant le paiement (min)" type="number" min={2} max={30} value={f.dureeBlocageSiegeMin} onChange={num('dureeBlocageSiegeMin')} />
        <Select
          label="Périodicité des reversements"
          value={f.periodiciteReversement}
          onChange={(e) => setF({ ...f, periodiciteReversement: e.target.value as ParametresPlateforme['periodiciteReversement'] })}
        >
          <option value="hebdomadaire">Hebdomadaire</option>
          <option value="bimensuelle">Bimensuelle</option>
          <option value="mensuelle">Mensuelle</option>
        </Select>
      </div>
      <ApiErrorAlert error={modifier.error} />
      <div className="form-actions">
        <Button
          isLoading={modifier.isPending}
          onClick={() => modifier.mutate(f, { onSuccess: () => showToast('Paramètres enregistrés.', 'success') })}
        >
          Enregistrer
        </Button>
      </div>
    </Card>
  )
}
