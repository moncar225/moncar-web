import { useState } from 'react'
import { Button, Input, Modal, Select, Table, Tabs, Textarea, useToast } from '@/components/ui'
import type { Compagnie, Fournisseur, StatutValidation } from '@/domain/types'
import { ApiErrorAlert, PageHeader, QueryView } from '@/features/shared/components/Page'
import { StatutBadge } from '@/features/shared/labels'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { date } from '@/lib/format'
import {
  useCompagnies,
  useCreerCompagnie,
  useDeciderCompagnie,
  useDeciderFournisseur,
  useFournisseurs,
  useVilles,
  type Decision,
} from '@/services/referentiels'

type Cible = { type: 'compagnie'; item: Compagnie } | { type: 'fournisseur'; item: Fournisseur }

const TYPES_FOURNISSEUR: Record<Fournisseur['type'], string> = {
  agence: 'Agence de location',
  compagnie: 'Compagnie (location de cars)',
  proprietaire: 'Propriétaire individuel',
}

/** Validation des compagnies et fournisseurs par PROSOFT (REF-001, LOC-001). */
export default function ValidationPage() {
  useDocumentTitle('MON CAR — Validation des partenaires')
  const [onglet, setOnglet] = useState('compagnies')
  const [cible, setCible] = useState<Cible | null>(null)
  const [creation, setCreation] = useState(false)
  const compagnies = useCompagnies()
  const fournisseurs = useFournisseurs()
  const villes = useVilles()
  const nomVille = (id: string) => villes.data?.find((v) => v.id === id)?.nom ?? '—'
  const enAttente =
    (compagnies.data?.filter((c) => c.statut === 'en_attente').length ?? 0) +
    (fournisseurs.data?.filter((f) => f.statut === 'en_attente').length ?? 0)

  return (
    <>
      <PageHeader
        title="Validation des partenaires"
        description={`${enAttente} dossier(s) en attente de décision. Toute décision est journalisée.`}
        actions={<Button onClick={() => setCreation(true)}>Créer une compagnie</Button>}
      />
      <Tabs
        ariaLabel="Type de partenaire"
        tabs={[
          { id: 'compagnies', label: 'Compagnies de transport' },
          { id: 'fournisseurs', label: 'Fournisseurs BUSINESS' },
        ]}
        active={onglet}
        onChange={setOnglet}
      >
        {onglet === 'compagnies' ? (
          <QueryView query={compagnies} loading="Chargement des compagnies…">
            {(data) => (
              <Table<Compagnie>
                caption="Compagnies"
                rowKey={(c) => c.id}
                rows={[...data].sort((a, b) => Number(b.statut === 'en_attente') - Number(a.statut === 'en_attente'))}
                columns={[
                  { key: 'nom', header: 'Compagnie', render: (c) => <><strong>{c.nom}</strong><br /><span className="muted">{c.sigle} · {c.email}</span></> },
                  { key: 'ville', header: 'Siège', render: (c) => nomVille(c.villeSiegeId) },
                  { key: 'creeLe', header: 'Demande', render: (c) => date(c.creeLe) },
                  { key: 'statut', header: 'Statut', render: (c) => <StatutBadge table="validation" statut={c.statut} /> },
                  {
                    key: 'actions',
                    header: 'Décision',
                    render: (c) => (
                      <Button size="sm" variant={c.statut === 'en_attente' ? 'primary' : 'outline'} onClick={() => setCible({ type: 'compagnie', item: c })}>
                        {c.statut === 'en_attente' ? 'Examiner' : 'Modifier'}
                      </Button>
                    ),
                  },
                ]}
              />
            )}
          </QueryView>
        ) : (
          <QueryView query={fournisseurs} loading="Chargement des fournisseurs…">
            {(data) => (
              <Table<Fournisseur>
                caption="Fournisseurs de location"
                rowKey={(f) => f.id}
                rows={[...data].sort((a, b) => Number(b.statut === 'en_attente') - Number(a.statut === 'en_attente'))}
                columns={[
                  { key: 'nom', header: 'Fournisseur', render: (f) => <><strong>{f.nom}</strong><br /><span className="muted">{f.telephone}</span></> },
                  { key: 'type', header: 'Type', render: (f) => `${TYPES_FOURNISSEUR[f.type]}${f.vtc ? ' · VTC' : ''}` },
                  { key: 'ville', header: 'Ville', render: (f) => nomVille(f.villeId) },
                  { key: 'statut', header: 'Statut', render: (f) => <StatutBadge table="validation" statut={f.statut} /> },
                  {
                    key: 'actions',
                    header: 'Décision',
                    render: (f) => (
                      <Button size="sm" variant={f.statut === 'en_attente' ? 'primary' : 'outline'} onClick={() => setCible({ type: 'fournisseur', item: f })}>
                        {f.statut === 'en_attente' ? 'Examiner' : 'Modifier'}
                      </Button>
                    ),
                  },
                ]}
              />
            )}
          </QueryView>
        )}
      </Tabs>
      {cible !== null && <DecisionModal cible={cible} onClose={() => setCible(null)} />}
      {creation && <CreationCompagnieModal onClose={() => setCreation(false)} />}
    </>
  )
}

function DecisionModal({ cible, onClose }: { cible: Cible; onClose: () => void }) {
  const { showToast } = useToast()
  const decCompagnie = useDeciderCompagnie()
  const decFournisseur = useDeciderFournisseur()
  const mutation = cible.type === 'compagnie' ? decCompagnie : decFournisseur
  const [decision, setDecision] = useState<Exclude<StatutValidation, 'en_attente'>>('validee')
  const [motif, setMotif] = useState('')

  function valider() {
    const payload: Decision = { id: cible.item.id, decision, motif: motif.trim() === '' ? undefined : motif.trim() }
    mutation.mutate(payload, {
      onSuccess: () => {
        showToast('Décision enregistrée.', 'success')
        onClose()
      },
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Décision — ${cible.item.nom}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={valider} isLoading={mutation.isPending} variant={decision === 'validee' ? 'primary' : 'danger'}>
            Enregistrer la décision
          </Button>
        </>
      }
    >
      <div className="stack">
        <p className="muted">
          Statut actuel : <StatutBadge table="validation" statut={cible.item.statut} />
        </p>
        <Select label="Décision" value={decision} onChange={(e) => setDecision(e.target.value as typeof decision)}>
          <option value="validee">Valider — le partenaire peut vendre sur MON CAR</option>
          <option value="refusee">Refuser le dossier</option>
          <option value="suspendue">Suspendre</option>
        </Select>
        <Textarea
          label={decision === 'validee' ? 'Commentaire (facultatif)' : 'Motif (obligatoire)'}
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
        />
        <ApiErrorAlert error={mutation.error} />
      </div>
    </Modal>
  )
}

function CreationCompagnieModal({ onClose }: { onClose: () => void }) {
  const { showToast } = useToast()
  const villes = useVilles()
  const creer = useCreerCompagnie()
  const [f, setF] = useState({ nom: '', sigle: '', telephone: '', email: '', adresse: '', villeSiegeId: '' })
  const maj = (cle: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [cle]: e.target.value })
  const complet = f.nom !== '' && f.sigle !== '' && f.telephone !== '' && f.email !== '' && f.villeSiegeId !== ''

  return (
    <Modal
      open
      onClose={onClose}
      title="Nouvelle compagnie"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button
            disabled={!complet}
            isLoading={creer.isPending}
            onClick={() =>
              creer.mutate(f, {
                onSuccess: () => {
                  showToast('Compagnie créée — en attente de validation.', 'success')
                  onClose()
                },
              })
            }
          >
            Créer
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Input label="Raison sociale" value={f.nom} onChange={maj('nom')} />
        <Input label="Sigle" value={f.sigle} onChange={maj('sigle')} maxLength={6} />
        <Input label="Téléphone" value={f.telephone} onChange={maj('telephone')} />
        <Input label="E-mail" type="email" value={f.email} onChange={maj('email')} />
        <Select label="Ville du siège" value={f.villeSiegeId} onChange={maj('villeSiegeId')}>
          <option value="">Choisir…</option>
          {villes.data?.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
        </Select>
        <Input label="Adresse" value={f.adresse} onChange={maj('adresse')} />
      </div>
      <p className="muted">
        La commission et les frais d’opération reprennent les paramètres de la plateforme (modifiables ensuite).
      </p>
      <ApiErrorAlert error={creer.error} />
    </Modal>
  )
}
