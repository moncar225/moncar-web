import { useState } from 'react'
import { Alert, Button, Card, Input, Modal, Select, Table, Tabs, useToast } from '@/components/ui'
import { useAuth } from '@/app/providers/AuthProvider'
import type { Colis, EtapeColis } from '@/domain/types'
import { imprimer, ZoneImpression } from '@/features/shared/components/Impression'
import { ApiErrorAlert, PageHeader, QueryView } from '@/features/shared/components/Page'
import { LIBELLES_ETAPE_COLIS, StatutBadge } from '@/features/shared/labels'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { dateHeure, fcfa, heure, jourLocal } from '@/lib/format'
import { useVoyages } from '@/services/exploitation'
import { useColisGare, useCreerColis, useDevisColis, useEtapeColis, useRemiseColis } from '@/services/gare'
import { useGares } from '@/services/referentiels'

const SUIVANTE: Partial<Record<EtapeColis, EtapeColis>> = {
  enregistre: 'recu',
  recu: 'controle',
  controle: 'charge',
  charge: 'en_transit',
  en_transit: 'arrive',
  arrive: 'disponible',
}

/** Poste Service colis (COL-002) : liste de la gare, étapes, remise contre preuve, bon. */
export default function ColisPage() {
  useDocumentTitle('MON CAR — Service colis')
  const { session } = useAuth()
  const gares = useGares()
  const gareId = session?.gare?.id ?? gares.data?.[0]?.id
  const colis = useColisGare(gareId)
  const [onglet, setOnglet] = useState('depart')
  const [nouveau, setNouveau] = useState(false)
  const [detail, setDetail] = useState<Colis | null>(null)
  const nomGare = (id: string) => gares.data?.find((g) => g.id === id)?.nom ?? '—'

  return (
    <>
      <PageHeader
        title="Service colis"
        description={session?.gare?.nom ?? undefined}
        actions={<Button onClick={() => setNouveau(true)}>Enregistrer un colis</Button>}
      />
      <QueryView query={colis} loading="Colis de la gare…">
        {(data) => {
          const listes: Record<string, Colis[]> = {
            depart: data.filter((c) => c.gareDepartId === gareId && ['enregistre', 'recu', 'controle', 'charge'].includes(c.statut)),
            arrivee: data.filter((c) => c.gareArriveeId === gareId && ['en_transit', 'arrive', 'disponible'].includes(c.statut)),
            tous: data,
          }
          const aRemettre = data.filter((c) => c.gareArriveeId === gareId && c.statut === 'disponible').length
          return (
            <>
              <div className="kpis">
                <div className="kpi"><p className="kpi__label">À expédier</p><p className="kpi__value">{listes.depart?.length ?? 0}</p></div>
                <div className="kpi"><p className="kpi__label">Attendus / arrivés</p><p className="kpi__value">{listes.arrivee?.length ?? 0}</p></div>
                <div className="kpi"><p className="kpi__label">À remettre</p><p className="kpi__value">{aRemettre}</p></div>
              </div>
              <Tabs
                ariaLabel="Liste"
                tabs={[
                  { id: 'depart', label: 'Au départ' },
                  { id: 'arrivee', label: 'À l’arrivée' },
                  { id: 'tous', label: 'Tous' },
                ]}
                active={onglet}
                onChange={setOnglet}
              >
                <Table<Colis>
                  caption="Colis"
                  rowKey={(c) => c.id}
                  rows={listes[onglet] ?? []}
                  columns={[
                    { key: 'numero', header: 'Colis', render: (c) => <><strong>{c.numero}</strong><br /><span className="muted">{c.nature} · {c.poidsKg} kg</span></> },
                    { key: 'trajet', header: 'Trajet', render: (c) => `${nomGare(c.gareDepartId)} → ${nomGare(c.gareArriveeId)}` },
                    { key: 'dest', header: 'Destinataire', render: (c) => <>{c.destinataire.nom}<br /><span className="muted">{c.destinataire.telephone}</span></> },
                    { key: 'statut', header: 'Étape', render: (c) => <StatutBadge table="colis" statut={c.statut} /> },
                    { key: 'actions', header: '', render: (c) => <Button size="sm" variant="outline" onClick={() => setDetail(c)}>Ouvrir</Button> },
                  ]}
                />
              </Tabs>
            </>
          )
        }}
      </QueryView>
      {nouveau && gareId !== undefined && <NouveauColis gareId={gareId} onClose={() => setNouveau(false)} onCree={(c) => { setNouveau(false); setDetail(c) }} />}
      {detail !== null && <DetailColis colisId={detail.id} gareId={gareId} onClose={() => setDetail(null)} />}
    </>
  )
}

function NouveauColis({ gareId, onClose, onCree }: { gareId: string; onClose: () => void; onCree: (c: Colis) => void }) {
  const gares = useGares()
  const devis = useDevisColis()
  const creer = useCreerColis()
  const [f, setF] = useState({
    expediteurNom: '',
    expediteurTel: '',
    destinataireNom: '',
    destinataireTel: '',
    gareArriveeId: '',
    nature: '',
    poidsKg: '',
    valeurDeclaree: '0',
  })
  const maj = (cle: keyof typeof f) => (e: { target: { value: string } }) => {
    setF({ ...f, [cle]: e.target.value })
    if (cle === 'poidsKg' || cle === 'valeurDeclaree') devis.reset()
  }
  const complet = Object.entries(f).every(([k, v]) => k === 'valeurDeclaree' || v.trim() !== '')
  return (
    <Modal
      open
      onClose={onClose}
      title="Enregistrer un colis"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant="outline" disabled={f.poidsKg === ''} isLoading={devis.isPending} onClick={() => devis.mutate({ poidsKg: Number(f.poidsKg), valeurDeclaree: Number(f.valeurDeclaree) })}>
            Calculer le tarif
          </Button>
          <Button disabled={!complet || devis.data === undefined} isLoading={creer.isPending} onClick={() => creer.mutate({ ...f, poidsKg: Number(f.poidsKg), valeurDeclaree: Number(f.valeurDeclaree) }, { onSuccess: onCree })}>
            Encaisser et enregistrer
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Input label="Expéditeur — nom" value={f.expediteurNom} onChange={maj('expediteurNom')} />
        <Input label="Expéditeur — téléphone" inputMode="tel" value={f.expediteurTel} onChange={maj('expediteurTel')} />
        <Input label="Destinataire — nom" value={f.destinataireNom} onChange={maj('destinataireNom')} />
        <Input label="Destinataire — téléphone" inputMode="tel" value={f.destinataireTel} onChange={maj('destinataireTel')} />
        <Select label="Gare d’arrivée" value={f.gareArriveeId} onChange={maj('gareArriveeId')}>
          <option value="">Choisir…</option>
          {gares.data?.filter((g) => g.id !== gareId).map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
        </Select>
        <Input label="Nature du colis" value={f.nature} onChange={maj('nature')} />
        <Input label="Poids (kg)" type="number" min={0.1} step={0.1} value={f.poidsKg} onChange={maj('poidsKg')} />
        <Input label="Valeur déclarée (F)" type="number" min={0} step={1000} value={f.valeurDeclaree} onChange={maj('valeurDeclaree')} />
      </div>
      {devis.data !== undefined && (
        <Alert variant="success">Tarif (calculé par le serveur) : <strong>{fcfa(devis.data.montant)}</strong>, frais d’opération inclus.</Alert>
      )}
      <ApiErrorAlert error={devis.error ?? creer.error} />
    </Modal>
  )
}

function DetailColis({ colisId, gareId, onClose }: { colisId: string; gareId: string | undefined; onClose: () => void }) {
  const colis = useColisGare(gareId)
  const c = colis.data?.find((x) => x.id === colisId)
  const gares = useGares()
  const etape = useEtapeColis()
  const remise = useRemiseColis()
  const voyages = useVoyages(jourLocal(), jourLocal(1))
  const { showToast } = useToast()
  const [voyageId, setVoyageId] = useState('')
  const [preuve, setPreuve] = useState({ recuPar: '', piece: '' })
  if (c === undefined) return null
  const suivante = SUIVANTE[c.statut]
  const nomGare = (id: string) => gares.data?.find((g) => g.id === id)?.nom ?? '—'
  const voyagesPossibles = (voyages.data ?? []).filter((v) => v.statut === 'programme' || v.statut === 'embarquement')

  return (
    <Modal
      open
      onClose={onClose}
      title={`Colis ${c.numero}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
          <Button variant="outline" onClick={imprimer}>Imprimer le bon</Button>
        </>
      }
    >
      <div className="stack">
        <p>
          <StatutBadge table="colis" statut={c.statut} /> · {nomGare(c.gareDepartId)} → {nomGare(c.gareArriveeId)} · {c.nature}, {c.poidsKg} kg ·{' '}
          {fcfa(c.montant)}
        </p>
        {suivante !== undefined && (
          <Card title={`Étape suivante : ${LIBELLES_ETAPE_COLIS[suivante]}`}>
            {suivante === 'charge' && (
              <Select label="Voyage qui transporte le colis" value={voyageId} onChange={(e) => setVoyageId(e.target.value)}>
                <option value="">Choisir…</option>
                {voyagesPossibles.map((v) => <option key={v.id} value={v.id}>{heure(v.depart)} — {v.ligneNom} ({v.reference})</option>)}
              </Select>
            )}
            <Button
              isLoading={etape.isPending}
              disabled={suivante === 'charge' && voyageId === ''}
              onClick={() => etape.mutate({ id: c.id, etape: suivante, voyageId: voyageId === '' ? undefined : voyageId }, { onSuccess: () => showToast('Étape enregistrée — le client est notifié.', 'success') })}
            >
              Passer à « {LIBELLES_ETAPE_COLIS[suivante]} »
            </Button>
          </Card>
        )}
        {c.statut === 'disponible' && (
          <Card title="Remise au destinataire (preuve obligatoire)">
            <div className="form-grid">
              <Input label="Remis à (nom)" value={preuve.recuPar} onChange={(e) => setPreuve({ ...preuve, recuPar: e.target.value })} />
              <Input label="Pièce d’identité (n°)" value={preuve.piece} onChange={(e) => setPreuve({ ...preuve, piece: e.target.value })} />
            </div>
            <Button isLoading={remise.isPending} onClick={() => remise.mutate({ id: c.id, ...preuve }, { onSuccess: () => showToast('Colis remis.', 'success') })}>
              Valider la remise
            </Button>
          </Card>
        )}
        {c.preuveRemise !== undefined && (
          <Alert variant="success">Remis le {dateHeure(c.preuveRemise.date)} à {c.preuveRemise.recuPar} (pièce {c.preuveRemise.piece}).</Alert>
        )}
        <ApiErrorAlert error={etape.error ?? remise.error} />
        <Card title="Historique">
          <ol className="ligne-schema">
            {c.historique.map((h, i) => (
              <li key={`${h.etape}-${i}`}>
                <strong>{LIBELLES_ETAPE_COLIS[h.etape]}</strong> — {dateHeure(h.date)}
                <br />
                <span className="muted">{h.lieu} · {h.auteur}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
      <ZoneImpression>
        <div className="doc-imprime billet">
          <p className="billet__numero">{c.numero}</p>
          <p>Bon de colis MON CAR</p>
          <dl>
            <dt>Expéditeur</dt><dd>{c.expediteur.nom} — {c.expediteur.telephone}</dd>
            <dt>Destinataire</dt><dd>{c.destinataire.nom} — {c.destinataire.telephone}</dd>
            <dt>Trajet</dt><dd>{nomGare(c.gareDepartId)} → {nomGare(c.gareArriveeId)}</dd>
            <dt>Contenu</dt><dd>{c.nature} — {c.poidsKg} kg — valeur déclarée {fcfa(c.valeurDeclaree)}</dd>
            <dt>Montant payé</dt><dd>{fcfa(c.montant)}</dd>
            <dt>Enregistré le</dt><dd>{dateHeure(c.historique[0]?.date ?? new Date().toISOString())}</dd>
          </dl>
          <p style={{ fontSize: '8pt' }}>Suivi : application MON CAR, rubrique « Envoyer un colis ». Remise contre pièce d’identité.</p>
        </div>
      </ZoneImpression>
    </Modal>
  )
}
