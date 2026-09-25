import { useState } from 'react'
import { Alert, Badge, Button, Input, Modal, Select, Table, useToast } from '@/components/ui'
import { useAuth } from '@/app/providers/AuthProvider'
import type { CategorieLocation, VehiculeLocation } from '@/domain/types'
import { ApiErrorAlert, PageHeader, QueryView } from '@/features/shared/components/Page'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { fcfa } from '@/lib/format'
import { useCreerVehiculeLocation, useModifierVehiculeLocation, useVehiculesLocation } from '@/services/business'

const CATEGORIES: Record<CategorieLocation, string> = {
  berline: 'Berline',
  suv: 'SUV',
  '4x4': '4x4',
  minibus: 'Minibus',
  bus: 'Bus',
  car: 'Car / autocar',
}
const STATUTS: Record<VehiculeLocation['statut'], [string, 'success' | 'neutral' | 'danger']> = {
  publie: ['Publié', 'success'],
  brouillon: ['Brouillon', 'neutral'],
  suspendu: ['Suspendu', 'danger'],
}

/** Publication des véhicules de location, dont l'offre VTC (LOC-001, LOC-006). */
export default function VehiculesLocationPage() {
  useDocumentTitle('MON CAR — Véhicules de location')
  const vehicules = useVehiculesLocation()
  const modifier = useModifierVehiculeLocation()
  const [edition, setEdition] = useState<VehiculeLocation | 'nouveau' | null>(null)
  return (
    <>
      <PageHeader
        title="Véhicules"
        description="Seuls les véhicules publiés apparaissent dans « Louer un véhicule » de l’app client."
        actions={<Button onClick={() => setEdition('nouveau')}>Ajouter un véhicule</Button>}
      />
      <QueryView query={vehicules} loading="Véhicules…" isEmpty={(d) => d.length === 0}>
        {(data) => (
          <Table<VehiculeLocation>
            caption="Véhicules de location"
            rowKey={(v) => v.id}
            rows={data}
            columns={[
              { key: 'titre', header: 'Véhicule', render: (v) => <><strong>{v.titre}</strong>{v.mode === 'vtc' && <> <Badge variant="accent">VTC</Badge></>}<br /><span className="muted">{CATEGORIES[v.categorie]} · {v.places} places</span></> },
              { key: 'conduite', header: 'Conduite', render: (v) => [v.avecChauffeur ? 'Avec chauffeur' : null, v.sansChauffeur ? 'Sans chauffeur' : null].filter(Boolean).join(' · ') },
              { key: 'tarifs', header: 'Tarifs', render: (v) => <>{fcfa(v.tarifJour)} / jour<br /><span className="muted">{fcfa(v.tarifDemiJour)} la demi-journée · +{fcfa(v.supplementExterieurJour)} hors zone</span></> },
              { key: 'statut', header: 'Statut', render: (v) => <Badge variant={STATUTS[v.statut][1]}>{STATUTS[v.statut][0]}</Badge> },
              {
                key: 'actions',
                header: '',
                render: (v) => (
                  <div className="row">
                    <Button size="sm" variant="outline" onClick={() => setEdition(v)}>Modifier</Button>
                    <Button size="sm" variant="ghost" onClick={() => modifier.mutate({ id: v.id, statut: v.statut === 'publie' ? 'suspendu' : 'publie' })}>
                      {v.statut === 'publie' ? 'Retirer' : 'Publier'}
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </QueryView>
      <ApiErrorAlert error={modifier.error} />
      {edition !== null && <FicheVehicule vehicule={edition === 'nouveau' ? null : edition} onClose={() => setEdition(null)} />}
    </>
  )
}

function FicheVehicule({ vehicule, onClose }: { vehicule: VehiculeLocation | null; onClose: () => void }) {
  const { session } = useAuth()
  const vtcAutorise = session?.fournisseur?.vtc === true
  const creer = useCreerVehiculeLocation()
  const modifier = useModifierVehiculeLocation()
  const mutation = vehicule === null ? creer : modifier
  const { showToast } = useToast()
  const [f, setF] = useState({
    titre: vehicule?.titre ?? '',
    categorie: vehicule?.categorie ?? ('berline' as CategorieLocation),
    places: String(vehicule?.places ?? 4),
    mode: vehicule?.mode ?? ('standard' as VehiculeLocation['mode']),
    avecChauffeur: vehicule?.avecChauffeur ?? true,
    sansChauffeur: vehicule?.sansChauffeur ?? false,
    tarifJour: String(vehicule?.tarifJour ?? ''),
    tarifDemiJour: String(vehicule?.tarifDemiJour ?? ''),
    supplementExterieurJour: String(vehicule?.supplementExterieurJour ?? 0),
  })
  const vtc = f.mode === 'vtc'
  function enregistrer() {
    const donnees = {
      titre: f.titre,
      categorie: f.categorie,
      places: Number(f.places),
      mode: f.mode,
      avecChauffeur: vtc ? true : f.avecChauffeur,
      sansChauffeur: vtc ? false : f.sansChauffeur,
      tarifJour: Number(f.tarifJour),
      tarifDemiJour: Number(f.tarifDemiJour === '' ? Math.round(Number(f.tarifJour) * 0.6) : f.tarifDemiJour),
      supplementExterieurJour: Number(f.supplementExterieurJour),
    }
    const options = { onSuccess: () => { showToast(vehicule === null ? 'Véhicule ajouté en brouillon.' : 'Véhicule modifié.', 'success'); onClose() } }
    if (vehicule === null) creer.mutate(donnees, options)
    else modifier.mutate({ id: vehicule.id, ...donnees }, options)
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={vehicule === null ? 'Nouveau véhicule' : `Modifier — ${vehicule.titre}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button disabled={f.titre === '' || f.tarifJour === ''} isLoading={mutation.isPending} onClick={enregistrer}>Enregistrer</Button>
        </>
      }
    >
      <div className="form-grid">
        <Input className="form-grid--full" label="Titre de l’annonce" value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} />
        <Select label="Catégorie" value={f.categorie} onChange={(e) => setF({ ...f, categorie: e.target.value as CategorieLocation })}>
          {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Input label="Places" type="number" min={1} value={f.places} onChange={(e) => setF({ ...f, places: e.target.value })} />
        <Select
          label="Mode de prestation"
          value={f.mode}
          onChange={(e) => setF({ ...f, mode: e.target.value as VehiculeLocation['mode'] })}
          hint={vtcAutorise ? undefined : 'Le mode VTC exige une autorisation VTC validée par PROSOFT.'}
        >
          <option value="standard">Location</option>
          <option value="vtc" disabled={!vtcAutorise}>VTC (avec chauffeur obligatoire)</option>
        </Select>
        <fieldset className="form-grid--full">
          <legend>Conduite</legend>
          <label className="row">
            <input type="checkbox" checked={vtc || f.avecChauffeur} disabled={vtc} onChange={(e) => setF({ ...f, avecChauffeur: e.target.checked })} />
            Avec chauffeur
          </label>
          <label className="row">
            <input type="checkbox" checked={!vtc && f.sansChauffeur} disabled={vtc} onChange={(e) => setF({ ...f, sansChauffeur: e.target.checked })} />
            Sans chauffeur (permis et pièce d’identité exigés du client)
          </label>
          {vtc && <Alert variant="info">Un véhicule VTC est obligatoirement fourni avec chauffeur (règle du cahier des charges).</Alert>}
        </fieldset>
        <Input label="Tarif journée (F)" type="number" min={0} step={1000} value={f.tarifJour} onChange={(e) => setF({ ...f, tarifJour: e.target.value })} />
        <Input label="Tarif demi-journée (F)" type="number" min={0} step={1000} value={f.tarifDemiJour} onChange={(e) => setF({ ...f, tarifDemiJour: e.target.value })} hint="Vide = 60 % du tarif journée" />
        <Input label="Supplément hors zone / jour (F)" type="number" min={0} step={1000} value={f.supplementExterieurJour} onChange={(e) => setF({ ...f, supplementExterieurJour: e.target.value })} />
      </div>
      <ApiErrorAlert error={mutation.error} />
    </Modal>
  )
}
