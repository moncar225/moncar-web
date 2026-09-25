import { useState } from 'react'
import { Alert, Button, Input, Modal, Select, Table, Textarea, useToast } from '@/components/ui'
import { Can } from '@/app/permissions'
import { ApiErrorAlert, PageHeader, QueryView } from '@/features/shared/components/Page'
import { StatutBadge } from '@/features/shared/labels'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { dateLongue, fcfa, heure, jourDe, jourLocal } from '@/lib/format'
import {
  useAffecter,
  useAgents,
  useCreerVoyage,
  useLignes,
  useStatutVoyage,
  useVehicules,
  useVoyages,
  type VoyageResume,
} from '@/services/exploitation'

/** Planning compagnie : programmation, affectations, statuts (VOY-001). */
export default function PlanningPage() {
  useDocumentTitle('MON CAR — Planning des voyages')
  const [decalage, setDecalage] = useState(0)
  const [ligneId, setLigneId] = useState('')
  const [programmation, setProgrammation] = useState(false)
  const [affectation, setAffectation] = useState<VoyageResume | null>(null)
  const [statut, setStatut] = useState<VoyageResume | null>(null)
  const du = jourLocal(decalage)
  const au = jourLocal(decalage + 6)
  const voyages = useVoyages(du, au)
  const lignes = useLignes()

  return (
    <>
      <PageHeader
        title="Planning des voyages"
        description={`Du ${dateLongue(`${du}T12:00:00`)} au ${dateLongue(`${au}T12:00:00`)}`}
        actions={
          <Can permission="planning.gerer">
            <Button onClick={() => setProgrammation(true)}>Programmer un voyage</Button>
          </Can>
        }
      />
      <div className="toolbar">
        <Button variant="outline" onClick={() => setDecalage(decalage - 7)}>← Semaine précédente</Button>
        <Button variant="ghost" onClick={() => setDecalage(0)} disabled={decalage === 0}>Aujourd’hui</Button>
        <Button variant="outline" onClick={() => setDecalage(decalage + 7)}>Semaine suivante →</Button>
        <Select label="Ligne" value={ligneId} onChange={(e) => setLigneId(e.target.value)}>
          <option value="">Toutes les lignes</option>
          {lignes.data?.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.nom}</option>)}
        </Select>
      </div>
      <QueryView query={voyages} loading="Chargement du planning…">
        {(data) => {
          const filtres = data.filter((v) => ligneId === '' || v.ligneId === ligneId)
          const aAffecter = filtres.filter((v) => v.statut !== 'annule' && v.statut !== 'arrive' && (v.vehicule === null || v.chauffeur === null))
          const jours = [...new Set(filtres.map((v) => jourDe(v.depart)))]
          return (
            <>
              {aAffecter.length > 0 && (
                <Alert variant="warning">
                  {aAffecter.length} voyage(s) sans véhicule ou sans chauffeur cette semaine.
                </Alert>
              )}
              {jours.length === 0 && <p className="muted">Aucun voyage programmé sur cette période.</p>}
              {jours.map((jour) => (
                <section key={jour} aria-label={dateLongue(`${jour}T12:00:00`)}>
                  <h3 className="jour-titre">{dateLongue(`${jour}T12:00:00`)}</h3>
                  <Table<VoyageResume>
                    caption={`Voyages du ${jour}`}
                    rowKey={(v) => v.id}
                    rows={filtres.filter((v) => jourDe(v.depart) === jour)}
                    columns={[
                      { key: 'depart', header: 'Départ', render: (v) => <strong>{heure(v.depart)}</strong> },
                      { key: 'ligne', header: 'Ligne', render: (v) => <>{v.ligneNom}<br /><span className="muted">{v.reference} · arrivée {heure(v.arrivee)}</span></> },
                      { key: 'vehicule', header: 'Véhicule', render: (v) => v.vehicule ?? <span className="muted">À affecter</span> },
                      { key: 'equipage', header: 'Chauffeur / convoyeur', render: (v) => <>{v.chauffeur ?? <span className="muted">—</span>}<br /><span className="muted">{v.convoyeur ?? '—'}</span></> },
                      {
                        key: 'remplissage',
                        header: 'Remplissage',
                        render: (v) => {
                          const taux = v.places === 0 ? 0 : Math.round((v.vendus / v.places) * 100)
                          return (
                            <>
                              <div className={`jauge${taux >= 85 ? ' jauge--haute' : ''}`} aria-hidden="true"><span style={{ width: `${Math.min(100, taux)}%` }} /></div>
                              <span className="muted">{v.vendus}/{v.places || '?'} · {fcfa(v.prixPlein)}</span>
                            </>
                          )
                        },
                      },
                      { key: 'statut', header: 'Statut', render: (v) => <><StatutBadge table="voyage" statut={v.statut} />{v.retardMinutes > 0 && <span className="muted"> +{v.retardMinutes} min</span>}</> },
                      {
                        key: 'actions',
                        header: '',
                        render: (v) =>
                          v.statut === 'arrive' || v.statut === 'annule' ? null : (
                            <Can permission="planning.gerer">
                              <div className="row">
                                <Button size="sm" variant="outline" onClick={() => setAffectation(v)}>Affecter</Button>
                                <Button size="sm" variant="ghost" onClick={() => setStatut(v)}>Retard / annulation</Button>
                              </div>
                            </Can>
                          ),
                      },
                    ]}
                  />
                </section>
              ))}
            </>
          )
        }}
      </QueryView>
      {programmation && <ProgrammationModal onClose={() => setProgrammation(false)} />}
      {affectation !== null && <AffectationModal voyage={affectation} onClose={() => setAffectation(null)} />}
      {statut !== null && <StatutModal voyage={statut} onClose={() => setStatut(null)} />}
    </>
  )
}


function ProgrammationModal({ onClose }: { onClose: () => void }) {
  const lignes = useLignes()
  const creer = useCreerVoyage()
  const { showToast } = useToast()
  const [f, setF] = useState({ ligneId: '', jour: jourLocal(1), heure: '07:00', prix: '6000', repetitions: '1' })
  const maj = (cle: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [cle]: e.target.value })
  const [enCours, setEnCours] = useState(false)

  async function programmer() {
    setEnCours(true)
    const n = Math.max(1, Math.min(30, Number(f.repetitions)))
    let crees = 0
    try {
      for (let i = 0; i < n; i++) {
        const d = new Date(`${f.jour}T${f.heure}:00`)
        d.setDate(d.getDate() + i)
        await creer.mutateAsync({ ligneId: f.ligneId, depart: d.toISOString(), prixPlein: Number(f.prix) })
        crees++
      }
      showToast(`${crees} voyage(s) programmé(s).`, 'success')
      onClose()
    } catch {
      if (crees > 0) showToast(`${crees} voyage(s) programmé(s) avant l’erreur.`, 'info')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Programmer un voyage"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button disabled={f.ligneId === '' || Number(f.prix) <= 0} isLoading={enCours} onClick={() => void programmer()}>
            Programmer
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Select label="Ligne" value={f.ligneId} onChange={maj('ligneId')}>
          <option value="">Choisir…</option>
          {lignes.data?.filter((l) => l.active).map((l) => <option key={l.id} value={l.id}>{l.code} — {l.nom}</option>)}
        </Select>
        <Input label="Date" type="date" value={f.jour} min={jourLocal()} onChange={maj('jour')} />
        <Input label="Heure de départ" type="time" value={f.heure} onChange={maj('heure')} />
        <Input label="Prix du trajet complet (F)" type="number" min={500} step={100} value={f.prix} onChange={maj('prix')} hint="Les segments sont calculés par le serveur au prorata." />
        <Input label="Répéter chaque jour (nombre de jours)" type="number" min={1} max={30} value={f.repetitions} onChange={maj('repetitions')} />
      </div>
      <ApiErrorAlert error={creer.error} />
    </Modal>
  )
}

function AffectationModal({ voyage, onClose }: { voyage: VoyageResume; onClose: () => void }) {
  const vehicules = useVehicules()
  const agents = useAgents()
  const affecter = useAffecter()
  const { showToast } = useToast()
  const [f, setF] = useState({
    vehiculeId: voyage.vehiculeId ?? '',
    chauffeurId: voyage.chauffeurId ?? '',
    convoyeurId: voyage.convoyeurId ?? '',
  })
  const maj = (cle: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [cle]: e.target.value })
  return (
    <Modal
      open
      onClose={onClose}
      title={`Affecter — ${voyage.ligneNom}, ${heure(voyage.depart)}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button
            isLoading={affecter.isPending}
            onClick={() => affecter.mutate({ id: voyage.id, ...f }, { onSuccess: () => { showToast('Affectation enregistrée.', 'success'); onClose() } })}
          >
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Select label="Véhicule" value={f.vehiculeId} onChange={maj('vehiculeId')}>
          <option value="">— Non affecté —</option>
          {vehicules.data?.map((v) => (
            <option key={v.id} value={v.id} disabled={v.etat === 'maintenance' || v.etat === 'hors_service'}>
              {v.immatriculation} · {v.marque} {v.modele} ({v.plan.cellules.filter((c) => c.type === 'siege').length} pl.)
              {v.etat === 'maintenance' ? ' — maintenance' : v.etat === 'hors_service' ? ' — hors service' : ''}
            </option>
          ))}
        </Select>
        <Select label="Chauffeur" value={f.chauffeurId} onChange={maj('chauffeurId')}>
          <option value="">— Non affecté —</option>
          {agents.data?.filter((a) => a.poste === 'chauffeur').map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
        </Select>
        <Select label="Convoyeur" value={f.convoyeurId} onChange={maj('convoyeurId')}>
          <option value="">— Non affecté —</option>
          {agents.data?.filter((a) => a.poste === 'convoyeur').map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
        </Select>
      </div>
      <p className="muted">Le serveur refuse une double affectation (même véhicule ou même agent sur un créneau qui se chevauche).</p>
      <ApiErrorAlert error={affecter.error} />
    </Modal>
  )
}

function StatutModal({ voyage, onClose }: { voyage: VoyageResume; onClose: () => void }) {
  const maj = useStatutVoyage()
  const { showToast } = useToast()
  const [retard, setRetard] = useState(String(voyage.retardMinutes))
  const [motif, setMotif] = useState('')
  return (
    <Modal
      open
      onClose={onClose}
      title={`Retard ou annulation — ${voyage.reference}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
          <Button
            variant="secondary"
            isLoading={maj.isPending}
            onClick={() => maj.mutate({ id: voyage.id, retardMinutes: Number(retard) }, { onSuccess: () => { showToast('Retard enregistré : les voyageurs seront notifiés.', 'success'); onClose() } })}
          >
            Enregistrer le retard
          </Button>
          <Button
            variant="danger"
            isLoading={maj.isPending}
            onClick={() => maj.mutate({ id: voyage.id, statut: 'annule', motif }, { onSuccess: () => { showToast('Voyage annulé.', 'success'); onClose() } })}
          >
            Annuler le voyage
          </Button>
        </>
      }
    >
      <div className="stack">
        <Input label="Retard annoncé (minutes)" type="number" min={0} step={5} value={retard} onChange={(e) => setRetard(e.target.value)} />
        <Textarea label="Motif d’annulation" value={motif} onChange={(e) => setMotif(e.target.value)} />
        {voyage.vendus > 0 && (
          <Alert variant="warning">
            {voyage.vendus} billet(s) vendu(s) : l’annulation déclenche les remboursements selon les règles A-5 (en attente d’arbitrage).
          </Alert>
        )}
        <ApiErrorAlert error={maj.error} />
      </div>
    </Modal>
  )
}
