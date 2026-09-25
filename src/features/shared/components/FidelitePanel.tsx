import { useState } from 'react'
import { Alert, Badge, Button, Card, Input, useToast } from '@/components/ui'
import type { ProgrammeFidelite } from '@/domain/types'
import { entier, fcfa } from '@/lib/format'
import { useModifierProgramme, useProgrammes } from '@/services/plateforme'
import { ApiErrorAlert, QueryView } from './Page'

/**
 * Programmes de fidélité (FID-001). Règles d'attribution et de valeur
 * paramétrables — valeurs ⚠ A-9 non arbitrées, rien n'est figé dans le code.
 */
export function FidelitePanel({ modifiable }: { modifiable: (p: ProgrammeFidelite) => boolean }) {
  const programmes = useProgrammes()
  return (
    <div className="stack">
      <Alert variant="warning">
        Règles de fidélité en attente d’arbitrage (A-9) : les valeurs ci-dessous sont paramétrables et journalisées.
      </Alert>
      <QueryView query={programmes} loading="Programmes…" isEmpty={(d) => d.length === 0}>
        {(data) => (
          <div className="two-cols">
            {data.map((p) => <Programme key={p.id} programme={p} modifiable={modifiable(p)} />)}
          </div>
        )}
      </QueryView>
    </div>
  )
}

function Programme({ programme: p, modifiable }: { programme: ProgrammeFidelite; modifiable: boolean }) {
  const modifier = useModifierProgramme()
  const { showToast } = useToast()
  const [f, setF] = useState({ pointsPour1000F: String(p.pointsPour1000F), valeurPointF: String(p.valeurPointF), validiteMois: String(p.validiteMois) })
  const maj = (cle: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [cle]: e.target.value })
  const tauxRetour = (Number(f.pointsPour1000F) * Number(f.valeurPointF)) / 10
  return (
    <Card title={p.nom} headerAction={<Badge variant={p.actif ? 'success' : 'neutral'}>{p.actif ? 'Actif' : 'Inactif'}</Badge>}>
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div className="kpi"><p className="kpi__label">Membres</p><p className="kpi__value">{entier(p.membres)}</p></div>
        <div className="kpi"><p className="kpi__label">Points émis</p><p className="kpi__value">{entier(p.pointsEmis)}</p></div>
        <div className="kpi"><p className="kpi__label">Utilisés</p><p className="kpi__value">{entier(p.pointsUtilises)}</p></div>
      </div>
      <div className="form-grid">
        <Input label="Points pour 1 000 F dépensés" type="number" min={0} step={0.5} value={f.pointsPour1000F} onChange={maj('pointsPour1000F')} disabled={!modifiable} />
        <Input label="Valeur d’un point (F)" type="number" min={0} value={f.valeurPointF} onChange={maj('valeurPointF')} disabled={!modifiable} />
        <Input label="Validité des points (mois)" type="number" min={1} value={f.validiteMois} onChange={maj('validiteMois')} disabled={!modifiable} />
      </div>
      <p className="muted">
        Retour client : {tauxRetour.toFixed(1)} % des dépenses (soit {fcfa(Math.round(tauxRetour * 100))} pour 10 000 F).
      </p>
      <ApiErrorAlert error={modifier.error} />
      {modifiable && (
        <div className="form-actions">
          <Button variant="ghost" onClick={() => modifier.mutate({ id: p.id, actif: !p.actif })}>{p.actif ? 'Suspendre' : 'Activer'}</Button>
          <Button
            isLoading={modifier.isPending}
            onClick={() =>
              modifier.mutate(
                { id: p.id, pointsPour1000F: Number(f.pointsPour1000F), valeurPointF: Number(f.valeurPointF), validiteMois: Number(f.validiteMois) },
                { onSuccess: () => showToast('Règles enregistrées.', 'success') },
              )
            }
          >
            Enregistrer les règles
          </Button>
        </div>
      )}
    </Card>
  )
}
