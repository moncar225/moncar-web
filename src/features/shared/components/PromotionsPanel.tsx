import { useState } from 'react'
import { Button, Input, Modal, Select, Table, Textarea, useToast } from '@/components/ui'
import type { Promotion } from '@/domain/types'
import { date, jourLocal } from '@/lib/format'
import { useCreerPromotion, usePromotions, useSoumettrePromotion } from '@/services/plateforme'
import { StatutBadge } from '../labels'
import { ApiErrorAlert, QueryView } from './Page'

const CIBLES: Record<Promotion['cible'], string> = { voyage: 'Voyages', colis: 'Colis', location: 'Location' }

/**
 * Promotions d'un partenaire (compagnie ou fournisseur) : brouillon →
 * soumission → validation par PROSOFT → diffusion (PRO-001).
 */
export function PromotionsPanel({ cibles }: { cibles: Array<Promotion['cible']> }) {
  const promotions = usePromotions()
  const soumettre = useSoumettrePromotion()
  const { showToast } = useToast()
  const [creation, setCreation] = useState(false)
  return (
    <>
      <div className="toolbar">
        <Button onClick={() => setCreation(true)}>Nouvelle promotion</Button>
      </div>
      <QueryView query={promotions} loading="Promotions…" isEmpty={(d) => d.length === 0}>
        {(data) => (
          <Table<Promotion>
            caption="Promotions"
            rowKey={(p) => p.id}
            rows={data}
            columns={[
              { key: 'titre', header: 'Promotion', render: (p) => <><strong>{p.titre}</strong><br /><span className="muted">{p.description}</span></> },
              { key: 'cible', header: 'Service', render: (p) => CIBLES[p.cible] },
              { key: 'reduction', header: 'Réduction', align: 'right', render: (p) => `−${p.reductionPct} %` },
              { key: 'periode', header: 'Période', render: (p) => `${date(p.debut)} → ${date(p.fin)}` },
              {
                key: 'statut',
                header: 'Statut',
                render: (p) => (
                  <>
                    <StatutBadge table="promotion" statut={p.statut} />
                    {p.motifRefus !== undefined && <><br /><span className="muted">{p.motifRefus}</span></>}
                  </>
                ),
              },
              {
                key: 'actions',
                header: '',
                render: (p) =>
                  p.statut === 'brouillon' || p.statut === 'refusee' ? (
                    <Button size="sm" onClick={() => soumettre.mutate(p.id, { onSuccess: () => showToast('Promotion soumise à PROSOFT.', 'success') })}>
                      Soumettre
                    </Button>
                  ) : null,
              },
            ]}
          />
        )}
      </QueryView>
      <ApiErrorAlert error={soumettre.error} />
      {creation && <CreationPromotion cibles={cibles} onClose={() => setCreation(false)} />}
    </>
  )
}

function CreationPromotion({ cibles, onClose }: { cibles: Array<Promotion['cible']>; onClose: () => void }) {
  const creer = useCreerPromotion()
  const { showToast } = useToast()
  const [f, setF] = useState({ titre: '', description: '', cible: cibles[0] ?? 'voyage', reductionPct: '10', debut: jourLocal(1), fin: jourLocal(30) })
  const maj = (cle: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [cle]: e.target.value })
  return (
    <Modal
      open
      onClose={onClose}
      title="Nouvelle promotion"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button
            disabled={f.titre === ''}
            isLoading={creer.isPending}
            onClick={() =>
              creer.mutate(
                { ...f, cible: f.cible as Promotion['cible'], reductionPct: Number(f.reductionPct) },
                { onSuccess: () => { showToast('Brouillon enregistré — soumettez-le à PROSOFT.', 'success'); onClose() } },
              )
            }
          >
            Enregistrer le brouillon
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Input className="form-grid--full" label="Titre" value={f.titre} onChange={maj('titre')} />
        <Textarea className="form-grid--full" label="Description" value={f.description} onChange={maj('description')} />
        <Select label="Service" value={f.cible} onChange={maj('cible')}>
          {cibles.map((c) => <option key={c} value={c}>{CIBLES[c]}</option>)}
        </Select>
        <Input label="Réduction (%)" type="number" min={1} max={50} value={f.reductionPct} onChange={maj('reductionPct')} />
        <Input label="Début" type="date" value={f.debut} onChange={maj('debut')} />
        <Input label="Fin" type="date" value={f.fin} onChange={maj('fin')} />
      </div>
      <ApiErrorAlert error={creer.error} />
    </Modal>
  )
}
