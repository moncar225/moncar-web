import { useState } from 'react'
import { Alert, Badge, Button, Modal, Table, Textarea, useToast } from '@/components/ui'
import { ApiErrorAlert, PageHeader, QueryView } from '@/features/shared/components/Page'
import { StatutBadge } from '@/features/shared/labels'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { date, dateHeure, fcfa } from '@/lib/format'
import { useDemandes, useRepondreDemande, type DemandeDetail } from '@/services/business'

/**
 * Demandes de location (LOC-002) : le client demande, le fournisseur accepte
 * ou refuse avec motif, puis le client paie (fonds en séquestre MON CAR).
 */
export default function DemandesPage() {
  useDocumentTitle('MON CAR — Demandes de location')
  const demandes = useDemandes()
  const repondre = useRepondreDemande()
  const { showToast } = useToast()
  const [refus, setRefus] = useState<DemandeDetail | null>(null)
  return (
    <>
      <PageHeader title="Demandes" description="Répondez vite : le client ne paie qu’après votre confirmation." />
      <Alert variant="info">
        Le paiement du client est conservé par MON CAR (séquestre) jusqu’à la restitution ; vous êtes réglé ensuite, commission
        déduite.
      </Alert>
      <QueryView query={demandes} loading="Demandes…" isEmpty={(d) => d.length === 0}>
        {(data) => (
          <Table<DemandeDetail>
            caption="Demandes de location"
            rowKey={(d) => d.id}
            rows={data}
            columns={[
              { key: 'numero', header: 'Demande', render: (d) => <><strong>{d.numero}</strong><br /><span className="muted">reçue le {dateHeure(d.creeLe)}</span></> },
              { key: 'vehicule', header: 'Véhicule', render: (d) => <>{d.vehicule}<br /><span className="muted">{d.avecChauffeur ? 'avec chauffeur' : 'sans chauffeur'}</span></> },
              { key: 'client', header: 'Client', render: (d) => <>{d.client.nom}<br /><span className="muted">{d.client.telephone}</span></> },
              {
                key: 'besoin',
                header: 'Besoin',
                render: (d) => (
                  <>
                    {date(d.debut)} → {date(d.fin)} · {d.personnes} pers.
                    <br />
                    <span className="muted">
                      {d.motif} · {d.zone === 'interieur' ? 'intérieur' : `extérieur → ${d.destination ?? '?'}`}
                    </span>
                  </>
                ),
              },
              { key: 'montant', header: 'Montant', align: 'right', render: (d) => fcfa(d.montant) },
              {
                key: 'statut',
                header: 'Statut',
                render: (d) => (
                  <>
                    <StatutBadge table="demande" statut={d.statut} />
                    {d.motifRefus !== undefined && <><br /><span className="muted">{d.motifRefus}</span></>}
                  </>
                ),
              },
              {
                key: 'actions',
                header: 'Réponse',
                render: (d) =>
                  d.statut === 'recue' ? (
                    <div className="row">
                      <Button size="sm" isLoading={repondre.isPending} onClick={() => repondre.mutate({ id: d.id, decision: 'acceptee' }, { onSuccess: () => showToast('Demande acceptée : le client est invité à payer.', 'success') })}>
                        Accepter
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setRefus(d)}>Refuser</Button>
                    </div>
                  ) : d.statut === 'payee' ? (
                    <Badge variant="success">Fonds sécurisés</Badge>
                  ) : null,
              },
            ]}
          />
        )}
      </QueryView>
      <ApiErrorAlert error={repondre.error} />
      {refus !== null && <RefusModal demande={refus} onClose={() => setRefus(null)} />}
    </>
  )
}

function RefusModal({ demande, onClose }: { demande: DemandeDetail; onClose: () => void }) {
  const repondre = useRepondreDemande()
  const [motif, setMotif] = useState('')
  return (
    <Modal
      open
      onClose={onClose}
      title={`Refuser la demande ${demande.numero}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant="danger" isLoading={repondre.isPending} onClick={() => repondre.mutate({ id: demande.id, decision: 'refusee', motif }, { onSuccess: onClose })}>
            Confirmer le refus
          </Button>
        </>
      }
    >
      <Textarea label="Motif (transmis au client)" value={motif} onChange={(e) => setMotif(e.target.value)} />
      <ApiErrorAlert error={repondre.error} />
    </Modal>
  )
}
