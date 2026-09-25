import { useState } from 'react'
import { Button, Modal, Table, Textarea, useToast } from '@/components/ui'
import type { Promotion } from '@/domain/types'
import { ApiErrorAlert, PageHeader, QueryView } from '@/features/shared/components/Page'
import { StatutBadge } from '@/features/shared/labels'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { date } from '@/lib/format'
import { usePromotions, useValiderPromotion } from '@/services/plateforme'

/** Validation des promotions par PROSOFT avant diffusion (PRO-001). */
export default function PromotionsValidationPage() {
  useDocumentTitle('MON CAR — Validation des promotions')
  const promotions = usePromotions()
  const [refus, setRefus] = useState<Promotion | null>(null)
  const valider = useValiderPromotion()
  const { showToast } = useToast()
  return (
    <>
      <PageHeader
        title="Promotions"
        description="Les promotions soumises par les compagnies et les fournisseurs sont diffusées après validation."
      />
      <QueryView query={promotions} loading="Promotions…" isEmpty={(d) => d.length === 0}>
        {(data) => (
          <Table<Promotion>
            caption="Promotions des partenaires"
            rowKey={(p) => p.id}
            rows={[...data].sort((a, b) => Number(b.statut === 'soumise') - Number(a.statut === 'soumise'))}
            columns={[
              { key: 'titre', header: 'Promotion', render: (p) => <><strong>{p.titre}</strong><br /><span className="muted">{p.auteurNom}</span></> },
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
                header: 'Décision',
                render: (p) =>
                  p.statut === 'soumise' ? (
                    <div className="row">
                      <Button
                        size="sm"
                        isLoading={valider.isPending}
                        onClick={() => valider.mutate({ id: p.id, decision: 'validee' }, { onSuccess: () => showToast('Promotion validée.', 'success') })}
                      >
                        Valider
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setRefus(p)}>Refuser</Button>
                    </div>
                  ) : null,
              },
            ]}
          />
        )}
      </QueryView>
      <ApiErrorAlert error={valider.error} />
      {refus !== null && <RefusModal promotion={refus} onClose={() => setRefus(null)} />}
    </>
  )
}

function RefusModal({ promotion, onClose }: { promotion: Promotion; onClose: () => void }) {
  const valider = useValiderPromotion()
  const [motif, setMotif] = useState('')
  return (
    <Modal
      open
      onClose={onClose}
      title={`Refuser — ${promotion.titre}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button
            variant="danger"
            isLoading={valider.isPending}
            onClick={() => valider.mutate({ id: promotion.id, decision: 'refusee', motif }, { onSuccess: onClose })}
          >
            Confirmer le refus
          </Button>
        </>
      }
    >
      <Textarea label="Motif (transmis au partenaire)" value={motif} onChange={(e) => setMotif(e.target.value)} />
      <ApiErrorAlert error={valider.error} />
    </Modal>
  )
}
