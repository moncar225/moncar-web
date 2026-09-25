import { useState } from 'react'
import { Badge, Button, Card, Modal, Select, Table, Textarea, useToast } from '@/components/ui'
import { useCan } from '@/app/permissions'
import type { Litige } from '@/domain/types'
import { dateHeure } from '@/lib/format'
import { useActionLitige, useLitiges } from '@/services/plateforme'
import { ApiErrorAlert, QueryView } from './Page'

const STATUTS: Record<Litige['statut'], [string, 'warning' | 'accent' | 'success' | 'neutral']> = {
  ouvert: ['Ouvert', 'warning'],
  en_cours: ['En cours', 'accent'],
  resolu: ['Résolu', 'success'],
  rejete: ['Rejeté', 'neutral'],
}
const TYPES: Record<Litige['type'], string> = { colis: 'Colis', location: 'Location', voyage: 'Voyage', paiement: 'Paiement' }

/**
 * Litiges (AUD-002) : le support PROSOFT instruit et décide ; la compagnie
 * ou le fournisseur mis en cause répond. Historique complet et tracé.
 */
export function LitigesPanel() {
  const litiges = useLitiges()
  const [ouvert, setOuvert] = useState<string | null>(null)
  return (
    <>
      <QueryView query={litiges} loading="Litiges…" isEmpty={(d) => d.length === 0}>
        {(data) => (
          <Table<Litige>
            caption="Dossiers de litige"
            rowKey={(l) => l.id}
            rows={[...data].sort((a, b) => Number(a.statut === 'resolu' || a.statut === 'rejete') - Number(b.statut === 'resolu' || b.statut === 'rejete'))}
            columns={[
              { key: 'numero', header: 'Dossier', render: (l) => <><strong>{l.numero}</strong><br /><span className="muted">{dateHeure(l.creeLe)}</span></> },
              { key: 'type', header: 'Type', render: (l) => TYPES[l.type] },
              { key: 'objet', header: 'Objet', render: (l) => <>{l.objet}<br /><span className="muted">{l.plaignant} contre {l.misEnCause}</span></> },
              { key: 'statut', header: 'Statut', render: (l) => <Badge variant={STATUTS[l.statut][1]}>{STATUTS[l.statut][0]}</Badge> },
              { key: 'actions', header: '', render: (l) => <Button size="sm" variant="outline" onClick={() => setOuvert(l.id)}>Ouvrir</Button> },
            ]}
          />
        )}
      </QueryView>
      {ouvert !== null && litiges.data !== undefined && (
        <Dossier litige={litiges.data.find((l) => l.id === ouvert)} onClose={() => setOuvert(null)} />
      )}
    </>
  )
}

function Dossier({ litige, onClose }: { litige: Litige | undefined; onClose: () => void }) {
  const can = useCan()
  const agir = useActionLitige()
  const { showToast } = useToast()
  const [action, setAction] = useState('')
  const [statut, setStatut] = useState<Litige['statut'] | ''>('')
  const [decision, setDecision] = useState('')
  if (litige === undefined) return null
  const support = can('admin.litiges.traiter')
  const clos = litige.statut === 'resolu' || litige.statut === 'rejete'
  return (
    <Modal
      open
      onClose={onClose}
      title={`${litige.numero} — ${litige.objet}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
          {!clos && (
            <Button
              isLoading={agir.isPending}
              onClick={() =>
                agir.mutate(
                  { id: litige.id, action, statut: statut === '' ? undefined : statut, decision: decision === '' ? undefined : decision },
                  { onSuccess: () => { showToast('Dossier mis à jour.', 'success'); setAction(''); setStatut(''); setDecision('') } },
                )
              }
            >
              {support ? 'Enregistrer' : 'Envoyer la réponse'}
            </Button>
          )}
        </>
      }
    >
      <div className="stack">
        <p>
          <Badge variant={STATUTS[litige.statut][1]}>{STATUTS[litige.statut][0]}</Badge> · {TYPES[litige.type]} · {litige.plaignant} contre{' '}
          {litige.misEnCause}
        </p>
        {litige.decision !== undefined && <Card title="Décision">{litige.decision}</Card>}
        <Card title="Historique">
          <ol className="ligne-schema">
            {litige.historique.map((h, i) => (
              <li key={`${h.date}-${i}`}>
                {h.action}
                <br />
                <span className="muted">{dateHeure(h.date)} · {h.auteur}</span>
              </li>
            ))}
          </ol>
        </Card>
        {!clos && (
          <>
            <Textarea label={support ? 'Action / note d’instruction' : 'Votre réponse'} value={action} onChange={(e) => setAction(e.target.value)} />
            {support && (
              <div className="form-grid">
                <Select label="Nouveau statut" value={statut} onChange={(e) => setStatut(e.target.value as Litige['statut'] | '')}>
                  <option value="">Inchangé</option>
                  <option value="en_cours">En cours d’instruction</option>
                  <option value="resolu">Résolu</option>
                  <option value="rejete">Rejeté</option>
                </Select>
                <Textarea label="Décision (obligatoire pour clore)" value={decision} onChange={(e) => setDecision(e.target.value)} />
              </div>
            )}
          </>
        )}
        <ApiErrorAlert error={agir.error} />
      </div>
    </Modal>
  )
}
