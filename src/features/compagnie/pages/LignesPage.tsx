import { useState } from 'react'
import { Alert, Badge, Button, Card, Input, Modal, Select, useToast } from '@/components/ui'
import type { Arret, Ligne } from '@/domain/types'
import { ApiErrorAlert, PageHeader, QueryView } from '@/features/shared/components/Page'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useCreerLigne, useEnregistrerArrets, useLignes } from '@/services/exploitation'
import { useGares, useVilles } from '@/services/referentiels'

/** Éditeur de lignes, arrêts ordonnés et segments (REF-002). */
export default function LignesPage() {
  useDocumentTitle('MON CAR — Lignes et arrêts')
  const lignes = useLignes()
  const [choisie, setChoisie] = useState<string | null>(null)
  const [creation, setCreation] = useState(false)
  return (
    <>
      <PageHeader
        title="Lignes et arrêts"
        description="Les arrêts définissent les segments vendus : un siège peut être revendu après la descente d’un passager."
        actions={<Button onClick={() => setCreation(true)}>Nouvelle ligne</Button>}
      />
      <QueryView query={lignes} loading="Chargement des lignes…" isEmpty={(d) => d.length === 0}>
        {(data) => {
          const ligne = data.find((l) => l.id === choisie) ?? data[0]
          return (
            <div className="split" style={{ gridTemplateColumns: 'minmax(0, 320px) minmax(0, 1fr)' }}>
              <Card title="Lignes">
                <ul className="list-plain">
                  {data.map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        className="selectable"
                        aria-current={l.id === ligne?.id}
                        style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}
                        onClick={() => setChoisie(l.id)}
                      >
                        <strong>{l.code}</strong> {l.active ? null : <Badge>Désactivée</Badge>}
                        <br />
                        <span className="muted">{l.nom} · {l.arrets.length} arrêts · {l.arrets[l.arrets.length - 1]?.kmDepuisOrigine ?? 0} km</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
              {ligne !== undefined && <EditeurLigne key={ligne.id} ligne={ligne} />}
            </div>
          )
        }}
      </QueryView>
      {creation && <CreationLigneModal onClose={() => setCreation(false)} />}
    </>
  )
}

function heures(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h === 0 ? `${m} min` : `${h} h ${String(m).padStart(2, '0')}`
}

function EditeurLigne({ ligne }: { ligne: Ligne }) {
  const villes = useVilles()
  const gares = useGares()
  const enregistrer = useEnregistrerArrets()
  const { showToast } = useToast()
  const [nom, setNom] = useState(ligne.nom)
  const [active, setActive] = useState(ligne.active)
  const [arrets, setArrets] = useState<Arret[]>(ligne.arrets)
  const modifie = JSON.stringify({ nom, active, arrets }) !== JSON.stringify({ nom: ligne.nom, active: ligne.active, arrets: ligne.arrets })

  const maj = (i: number, champ: keyof Arret, valeur: string) =>
    setArrets(
      arrets.map((a, j) =>
        j !== i
          ? a
          : {
              ...a,
              [champ]: ['minutesDepuisOrigine', 'kmDepuisOrigine', 'lat', 'lng'].includes(champ) ? Number(valeur) : valeur === '' && champ === 'gareId' ? undefined : valeur,
            },
      ),
    )
  const deplacer = (i: number, d: -1 | 1) => {
    const copie = [...arrets]
    const [x] = copie.splice(i, 1)
    if (x !== undefined) copie.splice(i + d, 0, x)
    setArrets(copie)
  }
  const ajouter = () => {
    const dernier = arrets[arrets.length - 1]
    setArrets([
      ...arrets,
      {
        id: '',
        ordre: arrets.length,
        nom: '',
        villeId: '',
        lat: dernier?.lat ?? 0,
        lng: dernier?.lng ?? 0,
        minutesDepuisOrigine: (dernier?.minutesDepuisOrigine ?? 0) + 30,
        kmDepuisOrigine: (dernier?.kmDepuisOrigine ?? 0) + 30,
      },
    ])
  }

  return (
    <div className="stack">
      <Card title={`${ligne.code} — ${ligne.nom}`}>
        <div className="toolbar">
          <Input label="Nom de la ligne" value={nom} onChange={(e) => setNom(e.target.value)} />
          <label className="row">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Ligne active (vendable)
          </label>
        </div>
        <div className="mc-table-wrap">
          <table className="mc-table arrets-table">
            <caption className="sr-only">Arrêts de la ligne</caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Arrêt</th>
                <th scope="col">Ville</th>
                <th scope="col">Gare</th>
                <th scope="col">Min. depuis l’origine</th>
                <th scope="col">Km</th>
                <th scope="col">Latitude</th>
                <th scope="col">Longitude</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {arrets.map((a, i) => (
                <tr key={a.id === '' ? `n${i}` : a.id}>
                  <td>{i}</td>
                  <td><input aria-label={`Nom de l’arrêt ${i}`} value={a.nom} onChange={(e) => maj(i, 'nom', e.target.value)} /></td>
                  <td>
                    <select aria-label={`Ville de l’arrêt ${i}`} value={a.villeId} onChange={(e) => maj(i, 'villeId', e.target.value)}>
                      <option value="">—</option>
                      {villes.data?.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
                    </select>
                  </td>
                  <td>
                    <select aria-label={`Gare de l’arrêt ${i}`} value={a.gareId ?? ''} onChange={(e) => maj(i, 'gareId', e.target.value)}>
                      <option value="">Arrêt simple</option>
                      {gares.data?.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
                    </select>
                  </td>
                  <td><input aria-label={`Minutes de l’arrêt ${i}`} type="number" min={0} value={a.minutesDepuisOrigine} disabled={i === 0} onChange={(e) => maj(i, 'minutesDepuisOrigine', e.target.value)} /></td>
                  <td><input aria-label={`Kilomètres de l’arrêt ${i}`} type="number" min={0} value={a.kmDepuisOrigine} disabled={i === 0} onChange={(e) => maj(i, 'kmDepuisOrigine', e.target.value)} /></td>
                  <td><input aria-label={`Latitude de l’arrêt ${i}`} type="number" step="0.0001" value={a.lat} onChange={(e) => maj(i, 'lat', e.target.value)} /></td>
                  <td><input aria-label={`Longitude de l’arrêt ${i}`} type="number" step="0.0001" value={a.lng} onChange={(e) => maj(i, 'lng', e.target.value)} /></td>
                  <td className="nowrap">
                    <Button size="sm" variant="ghost" aria-label="Monter" disabled={i <= 1} onClick={() => deplacer(i, -1)}>↑</Button>
                    <Button size="sm" variant="ghost" aria-label="Descendre" disabled={i === 0 || i === arrets.length - 1} onClick={() => deplacer(i, 1)}>↓</Button>
                    <Button size="sm" variant="ghost" aria-label={`Supprimer l’arrêt ${i}`} disabled={i === 0 || arrets.length <= 2} onClick={() => setArrets(arrets.filter((_, j) => j !== i))}>✕</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ApiErrorAlert error={enregistrer.error} />
        <div className="form-actions">
          <Button variant="outline" onClick={ajouter}>Ajouter un arrêt</Button>
          <Button variant="ghost" disabled={!modifie} onClick={() => { setNom(ligne.nom); setActive(ligne.active); setArrets(ligne.arrets) }}>
            Annuler les modifications
          </Button>
          <Button
            disabled={!modifie || arrets.some((a) => a.nom.trim() === '' || a.villeId === '')}
            isLoading={enregistrer.isPending}
            onClick={() => enregistrer.mutate({ id: ligne.id, nom, active, arrets }, { onSuccess: () => showToast('Ligne enregistrée.', 'success') })}
          >
            Enregistrer la ligne
          </Button>
        </div>
      </Card>
      <Card title="Schéma et segments">
        <ol className="ligne-schema">
          {arrets.map((a, i) => {
            const prec = arrets[i - 1]
            return (
              <li key={a.id === '' ? `s${i}` : a.id}>
                <strong>{a.nom === '' ? 'Nouvel arrêt' : a.nom}</strong>{' '}
                {a.gareId !== undefined && <Badge variant="primary">Gare</Badge>}
                <br />
                <span className="muted">
                  {i === 0
                    ? 'Origine'
                    : `+${heures(a.minutesDepuisOrigine - (prec?.minutesDepuisOrigine ?? 0))} · +${a.kmDepuisOrigine - (prec?.kmDepuisOrigine ?? 0)} km — cumul ${heures(a.minutesDepuisOrigine)}, ${a.kmDepuisOrigine} km`}
                </span>
              </li>
            )
          })}
        </ol>
        <Alert variant="info">
          {Math.max(0, arrets.length - 1)} segments. Les arrêts ayant des billets vendus sur des voyages à venir ne peuvent pas
          être supprimés ni déplacés (contrôle serveur).
        </Alert>
      </Card>
    </div>
  )
}

function CreationLigneModal({ onClose }: { onClose: () => void }) {
  const villes = useVilles()
  const creer = useCreerLigne()
  const { showToast } = useToast()
  const [f, setF] = useState({ code: '', origine: '', destination: '', minutes: '180', km: '200' })
  const maj = (cle: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [cle]: e.target.value })
  const vo = villes.data?.find((v) => v.id === f.origine)
  const vd = villes.data?.find((v) => v.id === f.destination)
  const complet = f.code !== '' && vo !== undefined && vd !== undefined && vo.id !== vd.id

  return (
    <Modal
      open
      onClose={onClose}
      title="Nouvelle ligne"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button
            disabled={!complet}
            isLoading={creer.isPending}
            onClick={() => {
              if (vo === undefined || vd === undefined) return
              creer.mutate(
                {
                  code: f.code,
                  nom: `${vo.nom} → ${vd.nom}`,
                  arrets: [
                    { nom: vo.nom, villeId: vo.id, lat: 0, lng: 0, minutesDepuisOrigine: 0, kmDepuisOrigine: 0 },
                    { nom: vd.nom, villeId: vd.id, lat: 0, lng: 0, minutesDepuisOrigine: Number(f.minutes), kmDepuisOrigine: Number(f.km) },
                  ],
                },
                {
                  onSuccess: () => {
                    showToast('Ligne créée : ajoutez les arrêts intermédiaires.', 'success')
                    onClose()
                  },
                },
              )
            }}
          >
            Créer
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Input label="Code" value={f.code} onChange={maj('code')} hint="Ex. LEX-03" />
        <Select label="Ville de départ" value={f.origine} onChange={maj('origine')}>
          <option value="">Choisir…</option>
          {villes.data?.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
        </Select>
        <Select label="Ville d’arrivée" value={f.destination} onChange={maj('destination')}>
          <option value="">Choisir…</option>
          {villes.data?.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
        </Select>
        <Input label="Durée de référence (min)" type="number" value={f.minutes} onChange={maj('minutes')} />
        <Input label="Distance (km)" type="number" value={f.km} onChange={maj('km')} />
      </div>
      <ApiErrorAlert error={creer.error} />
    </Modal>
  )
}
