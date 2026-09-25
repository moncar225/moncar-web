import { useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, EmptyState, Input, Modal, Select, Spinner, Textarea, useToast } from '@/components/ui'
import { useAuth } from '@/app/providers/AuthProvider'
import { isApiError } from '@/api/errors'
import type { MoyenPaiement } from '@/domain/types'
import { imprimer, ZoneImpression } from '@/features/shared/components/Impression'
import { ApiErrorAlert, PageHeader, QueryView } from '@/features/shared/components/Page'
import { SeatMap } from '@/features/shared/components/SeatMap'
import { MOYENS, StatutBadge } from '@/features/shared/labels'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { dateHeure, fcfa, heure, jourLocal } from '@/lib/format'
import { useDisponibilite, useVoyage, useVoyages } from '@/services/exploitation'
import {
  useAnnulerBillet,
  useCaisseCourante,
  useCloturerCaisse,
  useOuvrirCaisse,
  useVendre,
  type BilletEmis,
  type JournalCaisse,
} from '@/services/gare'

function nouvelleCle(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const MOYENS_GUICHET: MoyenPaiement[] = ['especes', 'orange_money', 'mtn_momo', 'moov_money', 'wave']

/** Caisse guichet : vente sur plan de sièges, encaissement, journal, clôture (CAI-001). */
export default function CaissePage() {
  useDocumentTitle('MON CAR — Caisse')
  const { session } = useAuth()
  const caisse = useCaisseCourante()
  return (
    <>
      <PageHeader
        title="Caisse"
        description={session?.gare?.nom ?? 'Aucune gare de rattachement'}
      />
      <QueryView query={caisse} loading="Ouverture de la caisse…">
        {(journal) => (journal === null ? <OuvertureCaisse /> : <Guichet journal={journal} />)}
      </QueryView>
    </>
  )
}

function OuvertureCaisse() {
  const ouvrir = useOuvrirCaisse()
  const [fond, setFond] = useState('50000')
  return (
    <Card title="Ouvrir la caisse">
      <form
        className="toolbar"
        onSubmit={(e) => {
          e.preventDefault()
          ouvrir.mutate(Number(fond))
        }}
      >
        <Input label="Fond de caisse (espèces)" type="number" min={0} step={500} value={fond} onChange={(e) => setFond(e.target.value)} />
        <Button type="submit" isLoading={ouvrir.isPending}>Ouvrir la caisse</Button>
      </form>
      <ApiErrorAlert error={ouvrir.error} />
    </Card>
  )
}

interface PassagerSaisi {
  nom: string
  telephone: string
  bagages: string
}

function Guichet({ journal }: { journal: JournalCaisse }) {
  const aujourdHui = jourLocal()
  const voyages = useVoyages(aujourdHui, jourLocal(1), { refetchInterval: 30_000 })
  const [voyageId, setVoyageId] = useState<string | null>(null)
  const voyage = useVoyage(voyageId)
  const [montee, setMontee] = useState(0)
  const [descente, setDescente] = useState(-1)
  const dernier = (voyage.data?.arrets.length ?? 0) - 1
  const arretDescente = descente < 0 ? dernier : descente
  const dispo = useDisponibilite(voyage.data === undefined ? null : voyageId, montee, arretDescente)
  const [sieges, setSieges] = useState<string[]>([])
  const [passagers, setPassagers] = useState<Record<string, PassagerSaisi>>({})
  const [moyen, setMoyen] = useState<MoyenPaiement>('especes')
  const [cle, setCle] = useState(nouvelleCle)
  const [billets, setBillets] = useState<BilletEmis[] | null>(null)
  const vendre = useVendre()
  const { showToast } = useToast()

  // Les sièges devenus indisponibles (vente en ligne, autre caisse) sortent
  // d'eux-mêmes de la sélection effective.
  const pris = dispo.data?.pris
  const selection = pris === undefined ? sieges : sieges.filter((x) => !pris.includes(x))

  const vendables = useMemo(
    () => (voyages.data ?? []).filter((v) => (v.statut === 'programme' || v.statut === 'embarquement') && v.vehicule !== null),
    [voyages.data],
  )

  function choisirVoyage(id: string) {
    setVoyageId(id)
    setMontee(0)
    setDescente(-1)
    setSieges([])
    setPassagers({})
    vendre.reset()
  }

  function basculer(numero: string) {
    setSieges((s) => (s.includes(numero) ? s.filter((x) => x !== numero) : [...s, numero]))
  }

  const complet = selection.length > 0 && selection.every((s) => (passagers[s]?.nom ?? '').trim() !== '')

  function encaisser() {
    if (voyageId === null) return
    vendre.mutate(
      {
        cle,
        vente: {
          voyageId,
          montee,
          descente: arretDescente,
          moyen,
          passagers: selection.map((s) => ({
            siege: s,
            nom: passagers[s]?.nom ?? '',
            telephone: passagers[s]?.telephone ?? '',
            bagages: Number(passagers[s]?.bagages ?? 0),
          })),
        },
      },
      {
        onSuccess: (r) => {
          setBillets(r.billets)
          setSieges([])
          setPassagers({})
          setCle(nouvelleCle())
          showToast(`${r.billets.length} billet(s) vendu(s) — ${fcfa(r.total)}.`, 'success')
        },
        onError: (err) => {
          // Siège pris entre-temps : nouvelle tentative = nouvelle clé.
          if (isApiError(err) && err.statusCode === 409) {
            setCle(nouvelleCle())
            void dispo.refetch()
          }
        },
      },
    )
  }

  return (
    <div className="caisse">
      <div className="stack">
        <Card title="1. Voyage">
          <QueryView query={voyages} loading="Voyages du jour…" isEmpty={() => vendables.length === 0} empty={<EmptyState title="Aucun voyage vendable aujourd’hui" />}>
            {() => (
              <div className="voyages-du-jour">
                {vendables.map((v) => (
                  <button key={v.id} type="button" className="voyage-choix" aria-pressed={v.id === voyageId} onClick={() => choisirVoyage(v.id)}>
                    <strong>{heure(v.depart)}</strong> {v.depart.slice(0, 10) !== new Date().toISOString().slice(0, 10) && <Badge>Demain</Badge>}
                    <br />
                    {v.ligneNom}
                    <br />
                    <span className="muted">{v.places - v.vendus} place(s) libre(s) sur le trajet complet</span>
                  </button>
                ))}
              </div>
            )}
          </QueryView>
        </Card>

        {voyage.data !== undefined && (
          <Card title="2. Trajet et sièges">
            <div className="toolbar">
              <Select label="Montée" value={montee} onChange={(e) => { setMontee(Number(e.target.value)); setSieges([]) }}>
                {voyage.data.arrets.slice(0, -1).map((a) => <option key={a.id} value={a.ordre}>{a.nom}</option>)}
              </Select>
              <Select label="Descente" value={arretDescente} onChange={(e) => { setDescente(Number(e.target.value)); setSieges([]) }}>
                {voyage.data.arrets.filter((a) => a.ordre > montee).map((a) => <option key={a.id} value={a.ordre}>{a.nom}</option>)}
              </Select>
              {dispo.data !== undefined && (
                <p className="muted" style={{ margin: 0 }}>
                  Prix du trajet : <strong>{fcfa(dispo.data.prix)}</strong> · {dispo.data.libres} siège(s) libre(s)
                </p>
              )}
            </div>
            {/* Erreur de vente ici : elle reste visible même si les sièges refusés quittent la sélection. */}
            <ApiErrorAlert error={vendre.error} />
            <QueryView query={dispo} loading="Plan du véhicule…">
              {(d) => <SeatMap plan={d.plan} pris={d.pris} selection={selection} onSelect={basculer} />}
            </QueryView>
          </Card>
        )}

        {selection.length > 0 && dispo.data !== undefined && (
          <Card title="3. Passagers et encaissement">
            <div className="stack">
              {selection.map((s) => (
                <div key={s} className="form-grid">
                  <Input
                    label={`Siège ${s} — nom du passager`}
                    value={passagers[s]?.nom ?? ''}
                    onChange={(e) => setPassagers({ ...passagers, [s]: { telephone: '', bagages: '0', ...passagers[s], nom: e.target.value } })}
                  />
                  <Input
                    label={`Siège ${s} — téléphone`}
                    inputMode="tel"
                    value={passagers[s]?.telephone ?? ''}
                    onChange={(e) => setPassagers({ ...passagers, [s]: { nom: '', bagages: '0', ...passagers[s], telephone: e.target.value } })}
                  />
                  <Input
                    label={`Siège ${s} — bagages en soute`}
                    type="number"
                    min={0}
                    value={passagers[s]?.bagages ?? '0'}
                    onChange={(e) => setPassagers({ ...passagers, [s]: { nom: '', telephone: '', ...passagers[s], bagages: e.target.value } })}
                  />
                </div>
              ))}
              <Select label="Moyen de paiement" value={moyen} onChange={(e) => setMoyen(e.target.value as MoyenPaiement)}>
                {MOYENS_GUICHET.map((m) => <option key={m} value={m}>{MOYENS[m]}</option>)}
              </Select>
              <div className="total-caisse">
                <span>{selection.length} billet(s) × {fcfa(dispo.data.prix)}</span>
                <span>{fcfa(dispo.data.prix * selection.length)}</span>
              </div>
              <p className="muted">Le montant définitif est calculé et enregistré par le serveur.</p>
              <div className="form-actions">
                <Button variant="ghost" onClick={() => setSieges([])}>Vider la sélection</Button>
                <Button disabled={!complet} isLoading={vendre.isPending} onClick={encaisser}>
                  Encaisser et imprimer
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <JournalDuJour journal={journal} />

      {billets !== null && <BilletsModal billets={billets} onClose={() => setBillets(null)} />}
    </div>
  )
}

function BilletsModal({ billets, onClose }: { billets: BilletEmis[]; onClose: () => void }) {
  return (
    <Modal
      open
      onClose={onClose}
      title={`${billets.length} billet(s) émis`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
          <Button onClick={imprimer}>Imprimer</Button>
        </>
      }
    >
      <ul className="list-plain">
        {billets.map((b) => (
          <li key={b.id}>
            <strong>{b.billetNumero}</strong> — siège {b.siege}, {b.passager.nom} · {b.trajet} · {fcfa(b.montant)}
          </li>
        ))}
      </ul>
      <ZoneImpression>
        <div className="doc-imprime">
          {billets.map((b) => (
            <article key={b.id} className="billet">
              <p className="billet__numero">{b.billetNumero}</p>
              <p>{b.compagnie} — billet MON CAR</p>
              <dl>
                <dt>Passager</dt><dd>{b.passager.nom}</dd>
                <dt>Trajet</dt><dd>{b.trajet}</dd>
                <dt>Départ</dt><dd>{dateHeure(b.depart)}</dd>
                <dt>Voyage</dt><dd>{b.voyageReference}</dd>
                <dt>Siège</dt><dd>{b.siege}</dd>
                <dt>Bagages</dt><dd>{b.bagages}</dd>
                <dt>Montant</dt><dd>{fcfa(b.montant)} ({MOYENS[b.moyen ?? 'especes']})</dd>
              </dl>
              <p style={{ fontSize: '8pt' }}>
                QR code signé : délivré par l’API MON CAR (signature ⚠ T-4). Présentez ce billet au contrôleur.
              </p>
            </article>
          ))}
        </div>
      </ZoneImpression>
    </Modal>
  )
}

function JournalDuJour({ journal }: { journal: JournalCaisse }) {
  const annuler = useAnnulerBillet()
  const [aAnnuler, setAAnnuler] = useState<string | null>(null)
  const [motif, setMotif] = useState('')
  const [cloture, setCloture] = useState(false)
  return (
    <Card title={`Journal de caisse — ouverte à ${heure(journal.session.ouverture)}`}>
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <div className="kpi"><p className="kpi__label">Ventes</p><p className="kpi__value">{fcfa(journal.totalVentes)}</p></div>
        <div className="kpi"><p className="kpi__label">Billets</p><p className="kpi__value">{journal.nombreBillets}</p></div>
      </div>
      <ul className="list-plain">
        {Object.entries(journal.parMoyen).map(([m, total]) => (
          <li key={m} className="row" style={{ justifyContent: 'space-between' }}>
            <span>{MOYENS[m as MoyenPaiement]}</span>
            <strong>{fcfa(total ?? 0)}</strong>
          </li>
        ))}
        <li className="row" style={{ justifyContent: 'space-between' }}>
          <span>Espèces attendues en caisse (fond inclus)</span>
          <strong>{fcfa(journal.especesAttendues)}</strong>
        </li>
      </ul>
      <Button variant="secondary" onClick={() => setCloture(true)}>Clôturer la caisse</Button>
      <h3 style={{ marginTop: 'var(--mc-space-4)' }}>Dernières ventes</h3>
      {journal.ventes.length === 0 && <p className="muted">Aucune vente pour l’instant.</p>}
      <ul className="list-plain">
        {journal.ventes.slice(0, 15).map((v) => (
          <li key={v.id}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span>
                <strong>{v.billetNumero}</strong> · siège {v.siege} · {v.passager.nom}
                <br />
                <span className="muted">{v.trajet} · {heure(v.depart)} · {MOYENS[v.moyen ?? 'especes']}</span>
              </span>
              <span className="row">
                {fcfa(v.montant)}
                {v.statut === 'payee' ? (
                  <Button size="sm" variant="ghost" onClick={() => { setAAnnuler(v.id); setMotif('') }}>Annuler</Button>
                ) : (
                  <StatutBadge table="reservation" statut={v.statut} />
                )}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {aAnnuler !== null && (
        <Modal
          open
          onClose={() => setAAnnuler(null)}
          title="Annuler la vente"
          footer={
            <>
              <Button variant="ghost" onClick={() => setAAnnuler(null)}>Retour</Button>
              <Button variant="danger" isLoading={annuler.isPending} onClick={() => annuler.mutate({ id: aAnnuler, motif }, { onSuccess: () => setAAnnuler(null) })}>
                Confirmer l’annulation
              </Button>
            </>
          }
        >
          <Textarea label="Motif (obligatoire)" value={motif} onChange={(e) => setMotif(e.target.value)} />
          <Alert variant="info">L’annulation crée une écriture inverse tracée ; le siège redevient disponible.</Alert>
          <ApiErrorAlert error={annuler.error} />
        </Modal>
      )}
      {cloture && <ClotureModal journal={journal} onClose={() => setCloture(false)} />}
    </Card>
  )
}

function ClotureModal({ journal, onClose }: { journal: JournalCaisse; onClose: () => void }) {
  const cloturer = useCloturerCaisse()
  const { showToast } = useToast()
  const [compte, setCompte] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const ecart = compte === '' ? null : Number(compte) - journal.especesAttendues
  return (
    <Modal
      open
      onClose={onClose}
      title="Clôture de caisse"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button
            disabled={compte === ''}
            isLoading={cloturer.isPending}
            onClick={() =>
              cloturer.mutate(
                { id: journal.session.id, montantDeclare: Number(compte), commentaire },
                { onSuccess: () => { showToast('Caisse clôturée.', 'success'); onClose() } },
              )
            }
          >
            Clôturer définitivement
          </Button>
        </>
      }
    >
      <div className="stack">
        <p>Espèces attendues : <strong>{fcfa(journal.especesAttendues)}</strong></p>
        <Input label="Espèces comptées" type="number" min={0} step={50} value={compte} onChange={(e) => setCompte(e.target.value)} />
        {ecart !== null && ecart !== 0 && (
          <Alert variant="warning">
            Écart de {fcfa(ecart)} : il sera signalé au chef de gare et à la direction (jamais masqué).
          </Alert>
        )}
        <Textarea label={ecart !== null && ecart !== 0 ? 'Justification de l’écart (obligatoire)' : 'Commentaire'} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
        <ApiErrorAlert error={cloturer.error} />
        {cloturer.isPending && <Spinner label="Clôture…" />}
      </div>
    </Modal>
  )
}
