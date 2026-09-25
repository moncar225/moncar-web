import { useState } from 'react'
import { Alert, Badge, Button, Input, Modal, Select, Table, useToast } from '@/components/ui'
import type { CelluleSiege, EtatVehicule, PlanSieges, Standing, TypeCellule, Vehicule } from '@/domain/types'
import { ApiErrorAlert, PageHeader, QueryView } from '@/features/shared/components/Page'
import { SeatMap } from '@/features/shared/components/SeatMap'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { date, entier, jourLocal } from '@/lib/format'
import { useCreerVehicule, useEnregistrerPlan, useModifierVehicule, useVehicules } from '@/services/exploitation'
import { useCategories } from '@/services/referentiels'

const SERVICES = ['Climatisation', 'Wi-Fi', 'Prises USB', 'Toilettes', 'Collation', 'Écrans']

function places(plan: PlanSieges): number {
  return plan.cellules.filter((c) => c.type === 'siege').length
}

/** Modèle de départ : 2 + 2 avec couloir, rangée avant (chauffeur, porte). */
export function modelePlan(rangees: number, colonnes: number, rangeesVip: number): PlanSieges {
  const cellules: CelluleSiege[] = []
  const couloir = Math.floor(colonnes / 2)
  let n = 1
  for (let rang = 0; rang < rangees; rang++) {
    for (let col = 0; col < colonnes; col++) {
      let type: TypeCellule = 'siege'
      if (rang === 0) type = col === 0 ? 'chauffeur' : col === colonnes - 1 ? 'porte' : 'vide'
      else if (col === couloir && colonnes % 2 === 1 && rang < rangees - 1) type = 'couloir'
      cellules.push(
        type === 'siege' ? { rang, col, type, numero: String(n++), classe: rang <= rangeesVip ? 'vip' : 'standard' } : { rang, col, type },
      )
    }
  }
  return { rangees, colonnes, cellules }
}

/** Gestionnaire de flotte : véhicules, états, maintenance, plans de sièges (FLT-001). */
export default function FlottePage() {
  useDocumentTitle('MON CAR — Flotte')
  const vehicules = useVehicules()
  const categories = useCategories()
  const modifier = useModifierVehicule()
  const [plan, setPlan] = useState<Vehicule | null>(null)
  const [edition, setEdition] = useState<Vehicule | 'nouveau' | null>(null)
  const nomCategorie = (id: string) => categories.data?.find((c) => c.id === id)?.nom ?? '—'
  const bientot = jourLocal(7)

  return (
    <>
      <PageHeader
        title="Flotte"
        description="Le plan de sièges saisi ici est celui affiché aux caisses et dans l’app client."
        actions={<Button onClick={() => setEdition('nouveau')}>Ajouter un véhicule</Button>}
      />
      <QueryView query={vehicules} loading="Chargement de la flotte…">
        {(data) => (
          <>
            <div className="kpis">
              <div className="kpi"><p className="kpi__label">Véhicules</p><p className="kpi__value">{data.length}</p></div>
              <div className="kpi"><p className="kpi__label">Disponibles</p><p className="kpi__value">{data.filter((v) => v.etat === 'disponible').length}</p></div>
              <div className="kpi"><p className="kpi__label">En maintenance</p><p className="kpi__value">{data.filter((v) => v.etat === 'maintenance').length}</p></div>
              <div className="kpi"><p className="kpi__label">Places totales</p><p className="kpi__value">{entier(data.reduce((s, v) => s + places(v.plan), 0))}</p></div>
            </div>
            <Table<Vehicule>
              caption="Véhicules de la compagnie"
              rowKey={(v) => v.id}
              rows={data}
              columns={[
                { key: 'immatriculation', header: 'Véhicule', render: (v) => <><strong>{v.immatriculation}</strong><br /><span className="muted">{v.marque} {v.modele}</span></> },
                { key: 'categorie', header: 'Catégorie', render: (v) => <>{nomCategorie(v.categorieId)}<br /><Badge variant={v.standing === 'Standard' ? 'neutral' : 'accent'}>{v.standing}</Badge></> },
                { key: 'places', header: 'Places', align: 'right', render: (v) => places(v.plan) },
                { key: 'km', header: 'Kilométrage', align: 'right', render: (v) => `${entier(v.kilometrage)} km` },
                {
                  key: 'maintenance',
                  header: 'Prochaine maintenance',
                  render: (v) =>
                    v.prochaineMaintenance === undefined ? '—' : (
                      <>
                        {date(v.prochaineMaintenance)} {v.prochaineMaintenance <= bientot && <Badge variant="warning">Bientôt</Badge>}
                      </>
                    ),
                },
                {
                  key: 'etat',
                  header: 'État',
                  render: (v) => (
                    <select
                      aria-label={`État de ${v.immatriculation}`}
                      value={v.etat}
                      onChange={(e) => modifier.mutate({ id: v.id, etat: e.target.value as EtatVehicule })}
                    >
                      <option value="disponible">Disponible</option>
                      <option value="en_service">En service</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="hors_service">Hors service</option>
                    </select>
                  ),
                },
                {
                  key: 'actions',
                  header: '',
                  render: (v) => (
                    <div className="row">
                      <Button size="sm" variant="outline" onClick={() => setPlan(v)}>Plan de sièges</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEdition(v)}>Fiche</Button>
                    </div>
                  ),
                },
              ]}
            />
            <ApiErrorAlert error={modifier.error} />
          </>
        )}
      </QueryView>
      {plan !== null && <EditeurPlan vehicule={plan} onClose={() => setPlan(null)} />}
      {edition !== null && <FicheVehicule vehicule={edition === 'nouveau' ? null : edition} onClose={() => setEdition(null)} />}
    </>
  )
}

const OUTILS: Array<{ id: string; libelle: string; type: TypeCellule; classe?: 'standard' | 'vip' }> = [
  { id: 'std', libelle: 'Siège standard', type: 'siege', classe: 'standard' },
  { id: 'vip', libelle: 'Siège VIP', type: 'siege', classe: 'vip' },
  { id: 'couloir', libelle: 'Couloir', type: 'couloir' },
  { id: 'vide', libelle: 'Vide', type: 'vide' },
  { id: 'porte', libelle: 'Porte', type: 'porte' },
  { id: 'chauffeur', libelle: 'Chauffeur', type: 'chauffeur' },
]

/** Éditeur visuel : outil choisi puis clic sur les cases ; renumérotation automatique. */
function EditeurPlan({ vehicule, onClose }: { vehicule: Vehicule; onClose: () => void }) {
  const enregistrer = useEnregistrerPlan()
  const { showToast } = useToast()
  const [plan, setPlanLocal] = useState<PlanSieges>(vehicule.plan)
  const [outil, setOutil] = useState('std')

  const renumeroter = (p: PlanSieges): PlanSieges => {
    let n = 1
    const tri = [...p.cellules].sort((a, b) => a.rang - b.rang || a.col - b.col)
    return {
      ...p,
      cellules: tri.map((c) => (c.type === 'siege' ? { ...c, numero: String(n++) } : { rang: c.rang, col: c.col, type: c.type })),
    }
  }
  const appliquer = (cible: CelluleSiege) => {
    const o = OUTILS.find((x) => x.id === outil)
    if (o === undefined) return
    const autres = plan.cellules.filter((c) => !(c.rang === cible.rang && c.col === cible.col))
    const nouvelle: CelluleSiege = o.type === 'siege' ? { rang: cible.rang, col: cible.col, type: 'siege', numero: '?', classe: o.classe } : { rang: cible.rang, col: cible.col, type: o.type }
    setPlanLocal(renumeroter({ ...plan, cellules: [...autres, nouvelle] }))
  }
  const rangees = (delta: 1 | -1) => {
    const n = Math.max(2, plan.rangees + delta)
    const cellules =
      delta === 1
        ? [...plan.cellules, ...Array.from({ length: plan.colonnes }, (_, col): CelluleSiege => ({ rang: n - 1, col, type: 'siege', numero: '?', classe: 'standard' }))]
        : plan.cellules.filter((c) => c.rang < n)
    setPlanLocal(renumeroter({ ...plan, rangees: n, cellules }))
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Plan de sièges — ${vehicule.immatriculation}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
          <Button
            isLoading={enregistrer.isPending}
            onClick={() => enregistrer.mutate({ id: vehicule.id, plan }, { onSuccess: () => { showToast('Plan enregistré.', 'success'); onClose() } })}
          >
            Enregistrer le plan ({places(plan)} places)
          </Button>
        </>
      }
    >
      <div className="stack">
        <div className="toolbar" role="radiogroup" aria-label="Outil">
          {OUTILS.map((o) => (
            <Button key={o.id} size="sm" variant={outil === o.id ? 'secondary' : 'outline'} aria-pressed={outil === o.id} onClick={() => setOutil(o.id)}>
              {o.libelle}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => rangees(1)}>+ Rangée</Button>
          <Button size="sm" variant="ghost" onClick={() => rangees(-1)}>− Rangée</Button>
        </div>
        <SeatMap plan={plan} onCellClick={appliquer} legende={false} />
        <p className="muted">Choisissez un outil puis cliquez sur les cases. Les sièges sont renumérotés de l’avant vers l’arrière.</p>
        <Alert variant="info">Un siège déjà vendu sur un voyage à venir ne peut pas être retiré du plan (contrôle serveur).</Alert>
        <ApiErrorAlert error={enregistrer.error} />
      </div>
    </Modal>
  )
}

function FicheVehicule({ vehicule, onClose }: { vehicule: Vehicule | null; onClose: () => void }) {
  const categories = useCategories()
  const creer = useCreerVehicule()
  const modifier = useModifierVehicule()
  const mutation = vehicule === null ? creer : modifier
  const { showToast } = useToast()
  const [f, setF] = useState({
    immatriculation: vehicule?.immatriculation ?? '',
    marque: vehicule?.marque ?? '',
    modele: vehicule?.modele ?? '',
    categorieId: vehicule?.categorieId ?? '',
    standing: vehicule?.standing ?? ('Standard' as Standing),
    kilometrage: String(vehicule?.kilometrage ?? 0),
    prochaineMaintenance: vehicule?.prochaineMaintenance ?? '',
    services: vehicule?.services ?? ['Climatisation'],
    rangees: '13',
    rangeesVip: '0',
  })
  const maj = (cle: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [cle]: e.target.value })
  const complet = f.immatriculation !== '' && f.marque !== '' && f.modele !== '' && f.categorieId !== ''

  function enregistrer() {
    const commun = {
      marque: f.marque,
      modele: f.modele,
      categorieId: f.categorieId,
      standing: f.standing,
      kilometrage: Number(f.kilometrage),
      prochaineMaintenance: f.prochaineMaintenance === '' ? undefined : f.prochaineMaintenance,
      services: f.services,
    }
    const options = { onSuccess: () => { showToast(vehicule === null ? 'Véhicule ajouté.' : 'Fiche enregistrée.', 'success'); onClose() } }
    if (vehicule === null) {
      creer.mutate({ ...commun, immatriculation: f.immatriculation, plan: modelePlan(Number(f.rangees), 5, Number(f.rangeesVip)) }, options)
    } else {
      modifier.mutate({ id: vehicule.id, ...commun }, options)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={vehicule === null ? 'Nouveau véhicule' : `Fiche — ${vehicule.immatriculation}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button disabled={!complet} isLoading={mutation.isPending} onClick={enregistrer}>Enregistrer</Button>
        </>
      }
    >
      <div className="form-grid">
        <Input label="Immatriculation" value={f.immatriculation} onChange={maj('immatriculation')} disabled={vehicule !== null} />
        <Input label="Marque" value={f.marque} onChange={maj('marque')} />
        <Input label="Modèle" value={f.modele} onChange={maj('modele')} />
        <Select label="Catégorie" value={f.categorieId} onChange={maj('categorieId')}>
          <option value="">Choisir…</option>
          {categories.data?.filter((c) => c.usage === 'transport').map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </Select>
        <Select label="Standing" value={f.standing} onChange={maj('standing')}>
          <option>Standard</option>
          <option>VIP</option>
          <option>Premium</option>
        </Select>
        <Input label="Kilométrage" type="number" value={f.kilometrage} onChange={maj('kilometrage')} />
        <Input label="Prochaine maintenance" type="date" value={f.prochaineMaintenance} onChange={maj('prochaineMaintenance')} />
        {vehicule === null && (
          <>
            <Input label="Rangées (plan de départ)" type="number" min={3} max={20} value={f.rangees} onChange={maj('rangees')} hint="2 + 2 avec couloir, modifiable ensuite" />
            <Input label="Rangées VIP à l’avant" type="number" min={0} value={f.rangeesVip} onChange={maj('rangeesVip')} />
          </>
        )}
        <fieldset className="form-grid--full">
          <legend>Services à bord</legend>
          <div className="row">
            {SERVICES.map((s) => (
              <label key={s} className="row">
                <input
                  type="checkbox"
                  checked={f.services.includes(s)}
                  onChange={(e) => setF({ ...f, services: e.target.checked ? [...f.services, s] : f.services.filter((x) => x !== s) })}
                />
                {s}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <ApiErrorAlert error={mutation.error} />
    </Modal>
  )
}

