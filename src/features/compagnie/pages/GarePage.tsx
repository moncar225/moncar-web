import { useState } from 'react'
import { Alert, Badge, Button, Card, EmptyState, Select, Table, Tabs, useToast } from '@/components/ui'
import { useAuth } from '@/app/providers/AuthProvider'
import { imprimer, ZoneImpression } from '@/features/shared/components/Impression'
import { ApiErrorAlert, PageHeader, QueryView } from '@/features/shared/components/Page'
import { LIBELLES_ETAPE_COLIS, StatutBadge } from '@/features/shared/labels'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { dateHeure, fcfa, heure, jourLocal } from '@/lib/format'
import { useGares } from '@/services/referentiels'
import {
  useGareSuivante,
  useManifeste,
  useProgression,
  useSessionsCaisse,
  useTableauGare,
  type LigneTableau,
  type Manifeste,
} from '@/services/gare'

/** Chef de gare : départs/arrivées, manifeste imprimable, gare suivante, caisses (MAN-001/002). */
export default function GarePage() {
  useDocumentTitle('MON CAR — Gare du jour')
  const { session } = useAuth()
  const gares = useGares()
  const [gareId, setGareId] = useState<string | undefined>(session?.gare?.id ?? undefined)
  const gare = gareId ?? gares.data?.[0]?.id
  const [onglet, setOnglet] = useState('tableau')
  const [voyageId, setVoyageId] = useState<string | null>(null)
  const tableau = useTableauGare(gare, jourLocal())

  return (
    <>
      <PageHeader
        title="Gare du jour"
        description="Départs, arrivées et passages ; le manifeste est recalculé en permanence (jamais ajusté à la main)."
        actions={
          session?.gare === null || session?.gare === undefined ? (
            <Select label="Gare" value={gare ?? ''} onChange={(e) => setGareId(e.target.value)}>
              {gares.data?.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
            </Select>
          ) : undefined
        }
      />
      <Tabs
        ariaLabel="Rubrique"
        tabs={[
          { id: 'tableau', label: 'Départs et arrivées' },
          { id: 'manifeste', label: 'Manifeste' },
          { id: 'suivante', label: 'Gare suivante' },
          { id: 'caisses', label: 'Caisses' },
        ]}
        active={onglet}
        onChange={setOnglet}
      >
        {onglet === 'tableau' && (
          <QueryView query={tableau} loading="Tableau de la gare…" isEmpty={(d) => d.length === 0} empty={<EmptyState title="Aucun voyage ne passe par cette gare aujourd’hui" />}>
            {(data) => (
              <TableauGare
                lignes={data}
                onManifeste={(id) => { setVoyageId(id); setOnglet('manifeste') }}
                onSuivante={(id) => { setVoyageId(id); setOnglet('suivante') }}
              />
            )}
          </QueryView>
        )}
        {onglet === 'manifeste' && <ManifesteOnglet voyages={tableau.data ?? []} voyageId={voyageId} onChoix={setVoyageId} />}
        {onglet === 'suivante' && <SuivanteOnglet voyages={tableau.data ?? []} voyageId={voyageId} onChoix={setVoyageId} />}
        {onglet === 'caisses' && <CaissesOnglet />}
      </Tabs>
    </>
  )
}

const SENS = { depart: 'Départ', arrivee: 'Arrivée', passage: 'Passage' } as const

function TableauGare({ lignes, onManifeste, onSuivante }: { lignes: LigneTableau[]; onManifeste: (id: string) => void; onSuivante: (id: string) => void }) {
  const progression = useProgression()
  const { showToast } = useToast()
  const agir = (id: string, action: 'embarquement' | 'depart' | 'passage', message: string) =>
    progression.mutate({ id, action }, { onSuccess: () => showToast(message, 'success') })
  return (
    <>
      <Table<LigneTableau>
        caption="Départs et arrivées du jour"
        rowKey={(l) => `${l.id}-${l.ordreGare}`}
        rows={lignes}
        columns={[
          { key: 'heure', header: 'Heure', render: (l) => <><strong>{heure(l.heureGare)}</strong>{l.retardMinutes > 0 && <><br /><Badge variant="warning">+{l.retardMinutes} min</Badge></>}</> },
          { key: 'sens', header: 'Mouvement', render: (l) => <Badge variant={l.sens === 'depart' ? 'primary' : l.sens === 'arrivee' ? 'success' : 'neutral'}>{SENS[l.sens]}</Badge> },
          { key: 'ligne', header: 'Voyage', render: (l) => <>{l.ligneNom}<br /><span className="muted">{l.reference} · {l.vehicule ?? 'véhicule à affecter'}</span></> },
          { key: 'embarquement', header: 'Embarquement ici', render: (l) => (l.sens === 'arrivee' ? '—' : `${l.embarques} / ${l.aEmbarquer}`) },
          { key: 'descente', header: 'Descentes ici', render: (l) => (l.sens === 'depart' ? '—' : l.aDebarquer) },
          { key: 'statut', header: 'Statut', render: (l) => <StatutBadge table="voyage" statut={l.statut} /> },
          {
            key: 'actions',
            header: 'Actions',
            render: (l) => (
              <div className="row">
                {l.sens === 'depart' && l.statut === 'programme' && (
                  <Button size="sm" onClick={() => agir(l.id, 'embarquement', 'Embarquement ouvert.')}>Ouvrir l’embarquement</Button>
                )}
                {l.sens === 'depart' && l.statut === 'embarquement' && (
                  <Button size="sm" onClick={() => agir(l.id, 'depart', 'Départ enregistré.')}>Départ</Button>
                )}
                {l.statut === 'en_route' && l.dernierArretFranchi < l.ordreGare && (
                  <Button size="sm" variant="secondary" onClick={() => agir(l.id, 'passage', 'Passage enregistré.')}>Arrivé en gare</Button>
                )}
                <Button size="sm" variant="outline" onClick={() => onManifeste(l.id)}>Manifeste</Button>
                {l.statut === 'en_route' && <Button size="sm" variant="ghost" onClick={() => onSuivante(l.id)}>Gare suivante</Button>}
              </div>
            ),
          },
        ]}
      />
      <ApiErrorAlert error={progression.error} />
    </>
  )
}

function ChoixVoyage({ voyages, voyageId, onChoix }: { voyages: LigneTableau[]; voyageId: string | null; onChoix: (id: string) => void }) {
  return (
    <div className="toolbar">
      <Select label="Voyage" value={voyageId ?? ''} onChange={(e) => onChoix(e.target.value)}>
        <option value="">Choisir un voyage…</option>
        {voyages.map((v) => (
          <option key={`${v.id}-${v.ordreGare}`} value={v.id}>
            {heure(v.heureGare)} — {v.ligneNom} ({v.reference})
          </option>
        ))}
      </Select>
    </div>
  )
}

function ManifesteOnglet({ voyages, voyageId, onChoix }: { voyages: LigneTableau[]; voyageId: string | null; onChoix: (id: string) => void }) {
  const manifeste = useManifeste(voyageId === '' ? null : voyageId)
  return (
    <>
      <ChoixVoyage voyages={voyages} voyageId={voyageId} onChoix={onChoix} />
      {voyageId !== null && voyageId !== '' && (
        <QueryView query={manifeste} loading="Calcul du manifeste…">
          {(m) => <ManifesteVue manifeste={m} />}
        </QueryView>
      )}
    </>
  )
}

function ManifesteVue({ manifeste: m }: { manifeste: Manifeste }) {
  return (
    <div className="stack">
      <div className="kpis">
        <div className="kpi"><p className="kpi__label">Capacité</p><p className="kpi__value">{m.capacite}</p></div>
        <div className="kpi"><p className="kpi__label">Billets actifs</p><p className="kpi__value">{m.passagers.length}</p></div>
        <div className="kpi"><p className="kpi__label">Embarqués</p><p className="kpi__value">{m.embarques}</p></div>
        <div className="kpi"><p className="kpi__label">Colis à bord</p><p className="kpi__value">{m.colis.length}</p></div>
      </div>
      <div className="row">
        <Button onClick={imprimer}>Imprimer le manifeste</Button>
        <span className="muted">Calculé le {dateHeure(m.genereLe)} à partir des ventes, scans et débarquements.</span>
      </div>
      <Card title="Par arrêt">
        <Table
          caption="Mouvements par arrêt"
          rowKey={(a) => String(a.ordre)}
          rows={m.arrets}
          columns={[
            { key: 'nom', header: 'Arrêt' },
            { key: 'heure', header: 'Heure prévue', render: (a) => heure(a.heurePrevue) },
            { key: 'montees', header: 'Montées', align: 'right' },
            { key: 'descentes', header: 'Descentes', align: 'right' },
            { key: 'aBordApres', header: 'À bord ensuite', align: 'right' },
          ]}
        />
      </Card>
      <Card title="Passagers">
        <Table
          caption="Passagers du voyage"
          rowKey={(p) => p.billetNumero}
          rows={m.passagers}
          columns={[
            { key: 'siege', header: 'Siège' },
            { key: 'passager', header: 'Passager', render: (p) => <>{p.passager}<br /><span className="muted">{p.telephone}</span></> },
            { key: 'trajet', header: 'Trajet', render: (p) => `${p.montee} → ${p.descente}` },
            { key: 'bagages', header: 'Bagages', align: 'right' },
            { key: 'canal', header: 'Canal', render: (p) => (p.canal === 'app' ? 'App' : 'Guichet') },
            { key: 'statut', header: 'Statut', render: (p) => <StatutBadge table="reservation" statut={p.statut} /> },
          ]}
        />
      </Card>
      <ZoneImpression>
        <div className="doc-imprime">
          <h1>Manifeste — {m.voyage.ligneNom}</h1>
          <p>
            Voyage {m.voyage.reference} · départ {dateHeure(m.voyage.depart)} · véhicule {m.voyage.vehicule ?? '—'} ·
            chauffeur {m.voyage.chauffeur ?? '—'} · convoyeur {m.voyage.convoyeur ?? '—'}
          </p>
          <p>Capacité {m.capacite} · billets {m.passagers.length} · embarqués {m.embarques} · édité le {dateHeure(m.genereLe)}</p>
          <table>
            <thead><tr><th>Arrêt</th><th>Heure</th><th>Montées</th><th>Descentes</th><th>À bord</th></tr></thead>
            <tbody>{m.arrets.map((a) => <tr key={a.ordre}><td>{a.nom}</td><td>{heure(a.heurePrevue)}</td><td>{a.montees}</td><td>{a.descentes}</td><td>{a.aBordApres}</td></tr>)}</tbody>
          </table>
          <table>
            <thead><tr><th>Siège</th><th>Billet</th><th>Passager</th><th>Téléphone</th><th>Montée</th><th>Descente</th><th>Bag.</th><th>Présent</th></tr></thead>
            <tbody>
              {m.passagers.map((p) => (
                <tr key={p.billetNumero}><td>{p.siege}</td><td>{p.billetNumero}</td><td>{p.passager}</td><td>{p.telephone}</td><td>{p.montee}</td><td>{p.descente}</td><td>{p.bagages}</td><td>{p.statut === 'embarquee' || p.statut === 'descendue' ? '✔' : '☐'}</td></tr>
              ))}
            </tbody>
          </table>
          {m.colis.length > 0 && (
            <table>
              <thead><tr><th>Colis</th><th>Nature</th><th>Poids</th><th>Étape</th></tr></thead>
              <tbody>{m.colis.map((c) => <tr key={c.numero}><td>{c.numero}</td><td>{c.nature}</td><td>{c.poidsKg} kg</td><td>{LIBELLES_ETAPE_COLIS[c.statut]}</td></tr>)}</tbody>
            </table>
          )}
          <p>Signature du chef de gare : ____________________ Signature du convoyeur : ____________________</p>
        </div>
      </ZoneImpression>
    </div>
  )
}

function SuivanteOnglet({ voyages, voyageId, onChoix }: { voyages: LigneTableau[]; voyageId: string | null; onChoix: (id: string) => void }) {
  const enRoute = voyages.filter((v) => v.statut === 'en_route')
  const info = useGareSuivante(voyageId === '' ? null : voyageId)
  return (
    <>
      {enRoute.length === 0 && <Alert variant="info">Aucun voyage en route passant par cette gare pour le moment.</Alert>}
      <ChoixVoyage voyages={enRoute} voyageId={voyageId} onChoix={onChoix} />
      {voyageId !== null && voyageId !== '' && (
        <QueryView query={info} loading="Calcul de l’arrivée…">
          {({ voyage, suivante }) =>
            suivante === null ? (
              <EmptyState title="Voyage arrivé" />
            ) : (
              <div className="stack">
                <Alert variant={suivante.retardMinutes > 0 ? 'warning' : 'info'} title={`Prochain arrêt : ${suivante.arret}`}>
                  {voyage.ligneNom} ({voyage.reference}) — arrivée estimée à <strong>{heure(suivante.heureEstimee)}</strong>
                  {suivante.retardMinutes > 0 && ` (retard ${suivante.retardMinutes} min)`}. Estimation serveur (GPS à venir).
                </Alert>
                <div className="kpis">
                  <div className="kpi"><p className="kpi__label">À débarquer</p><p className="kpi__value">{suivante.aDebarquer.length}</p></div>
                  <div className="kpi"><p className="kpi__label">À embarquer</p><p className="kpi__value">{suivante.aEmbarquer.length}</p></div>
                  <div className="kpi"><p className="kpi__label">Sièges libérés</p><p className="kpi__value">{suivante.siegesLiberes.length}</p></div>
                  <div className="kpi"><p className="kpi__label">Bagages / colis à décharger</p><p className="kpi__value">{suivante.bagagesADecharger} / {suivante.colisADecharger.length}</p></div>
                </div>
                <div className="two-cols">
                  <Card title="Passagers qui descendent">
                    <ul className="list-plain">
                      {suivante.aDebarquer.map((p) => <li key={p.siege}>Siège {p.siege} — {p.passager} {p.bagages > 0 && <Badge>{p.bagages} bagage(s)</Badge>}</li>)}
                      {suivante.aDebarquer.length === 0 && <li className="muted">Personne</li>}
                    </ul>
                  </Card>
                  <Card title="Sièges revendables après l’arrêt">
                    <p>{suivante.siegesLiberes.length === 0 ? 'Aucun' : suivante.siegesLiberes.join(', ')}</p>
                    <h4>Colis à décharger</h4>
                    <ul className="list-plain">
                      {suivante.colisADecharger.map((c) => <li key={c.numero}>{c.numero} — {c.nature} (pour {c.destinataire})</li>)}
                      {suivante.colisADecharger.length === 0 && <li className="muted">Aucun</li>}
                    </ul>
                  </Card>
                </div>
              </div>
            )
          }
        </QueryView>
      )}
    </>
  )
}

function CaissesOnglet() {
  const sessions = useSessionsCaisse()
  return (
    <QueryView query={sessions} loading="Caisses…" isEmpty={(d) => d.length === 0}>
      {(data) => (
        <Table
          caption="Sessions de caisse"
          rowKey={(s) => s.id}
          rows={data}
          columns={[
            { key: 'caissier', header: 'Caissier', render: (s) => <>{s.caissier}<br /><span className="muted">{s.gare}</span></> },
            { key: 'ouverture', header: 'Ouverture', render: (s) => dateHeure(s.ouverture) },
            { key: 'ventes', header: 'Ventes', align: 'right', render: (s) => <>{fcfa(s.totalVentes)}<br /><span className="muted">{s.nombreBillets} billet(s)</span></> },
            { key: 'attendu', header: 'Espèces attendues', align: 'right', render: (s) => fcfa(s.especesAttendues) },
            {
              key: 'ecart',
              header: 'Clôture',
              render: (s) =>
                s.statut === 'ouverte' ? <Badge variant="accent">Ouverte</Badge> : (
                  <>
                    {fcfa(s.montantDeclare ?? 0)}{' '}
                    {s.ecart !== undefined && s.ecart !== 0 ? <Badge variant="danger">Écart {fcfa(s.ecart)}</Badge> : <Badge variant="success">Juste</Badge>}
                    {s.commentaireEcart !== undefined && <><br /><span className="muted">{s.commentaireEcart}</span></>}
                  </>
                ),
            },
          ]}
        />
      )}
    </QueryView>
  )
}
