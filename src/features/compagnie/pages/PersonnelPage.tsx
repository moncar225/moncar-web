import { useState } from 'react'
import { Badge, Button, Input, Modal, Select, Table, Tabs, useToast } from '@/components/ui'
import type { Gare } from '@/domain/types'
import { ComptesPanel } from '@/features/shared/components/ComptesPanel'
import { ApiErrorAlert, PageHeader, QueryView } from '@/features/shared/components/Page'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useCreerGare, useGares, useModifierGare, useVilles } from '@/services/referentiels'

/** Poste « Gestion des gares / RH » : personnel (comptes agents) et gares. */
export default function PersonnelPage() {
  useDocumentTitle('MON CAR — Personnel et gares')
  const [onglet, setOnglet] = useState('personnel')
  return (
    <>
      <PageHeader
        title="Personnel et gares"
        description="Comptes des agents (web et app PRO) et gares de la compagnie."
      />
      <Tabs
        ariaLabel="Rubrique"
        tabs={[
          { id: 'personnel', label: 'Personnel' },
          { id: 'gares', label: 'Gares' },
        ]}
        active={onglet}
        onChange={setOnglet}
      >
        {onglet === 'personnel' ? <ComptesPanel espace="compagnie" /> : <Gares />}
      </Tabs>
    </>
  )
}

function Gares() {
  const gares = useGares()
  const villes = useVilles()
  const modifier = useModifierGare()
  const [edition, setEdition] = useState<Gare | 'nouvelle' | null>(null)
  const nomVille = (id: string) => villes.data?.find((v) => v.id === id)?.nom ?? '—'
  return (
    <>
      <div className="toolbar">
        <Button onClick={() => setEdition('nouvelle')}>Ajouter une gare</Button>
      </div>
      <QueryView query={gares} loading="Chargement des gares…">
        {(data) => (
          <Table<Gare>
            caption="Gares"
            rowKey={(g) => g.id}
            rows={data}
            columns={[
              { key: 'nom', header: 'Gare', render: (g) => <><strong>{g.nom}</strong><br /><span className="muted">{g.adresse}</span></> },
              { key: 'ville', header: 'Ville', render: (g) => nomVille(g.villeId) },
              { key: 'horaires', header: 'Horaires' },
              { key: 'position', header: 'Position', render: (g) => <span className="muted">{g.lat.toFixed(4)}, {g.lng.toFixed(4)}</span> },
              { key: 'active', header: 'Statut', render: (g) => <Badge variant={g.active ? 'success' : 'neutral'}>{g.active ? 'Active' : 'Fermée'}</Badge> },
              {
                key: 'actions',
                header: '',
                render: (g) => (
                  <div className="row">
                    <Button size="sm" variant="outline" onClick={() => setEdition(g)}>Modifier</Button>
                    <Button size="sm" variant="ghost" onClick={() => modifier.mutate({ id: g.id, active: !g.active })}>
                      {g.active ? 'Fermer' : 'Rouvrir'}
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </QueryView>
      <ApiErrorAlert error={modifier.error} />
      {edition !== null && <GareModal gare={edition === 'nouvelle' ? null : edition} onClose={() => setEdition(null)} />}
    </>
  )
}

function GareModal({ gare, onClose }: { gare: Gare | null; onClose: () => void }) {
  const villes = useVilles()
  const creer = useCreerGare()
  const modifier = useModifierGare()
  const mutation = gare === null ? creer : modifier
  const { showToast } = useToast()
  const [f, setF] = useState({
    nom: gare?.nom ?? '',
    villeId: gare?.villeId ?? '',
    adresse: gare?.adresse ?? '',
    horaires: gare?.horaires ?? '05:00 – 21:00',
    lat: String(gare?.lat ?? ''),
    lng: String(gare?.lng ?? ''),
  })
  const maj = (cle: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [cle]: e.target.value })
  const coordsOk = !Number.isNaN(Number(f.lat)) && !Number.isNaN(Number(f.lng)) && f.lat !== '' && f.lng !== ''

  function enregistrer() {
    const donnees = { ...f, lat: Number(f.lat), lng: Number(f.lng) }
    const options = {
      onSuccess: () => {
        showToast(gare === null ? 'Gare ajoutée.' : 'Gare modifiée.', 'success')
        onClose()
      },
    }
    if (gare === null) creer.mutate(donnees, options)
    else modifier.mutate({ id: gare.id, ...donnees }, options)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={gare === null ? 'Nouvelle gare' : `Modifier — ${gare.nom}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={enregistrer} disabled={f.nom === '' || f.villeId === '' || !coordsOk} isLoading={mutation.isPending}>
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Input label="Nom de la gare" value={f.nom} onChange={maj('nom')} />
        <Select label="Ville" value={f.villeId} onChange={maj('villeId')}>
          <option value="">Choisir…</option>
          {villes.data?.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
        </Select>
        <Input label="Adresse" value={f.adresse} onChange={maj('adresse')} />
        <Input label="Horaires d’ouverture" value={f.horaires} onChange={maj('horaires')} />
        <Input label="Latitude" inputMode="decimal" value={f.lat} onChange={maj('lat')} hint="Ex. 5.3563" />
        <Input label="Longitude" inputMode="decimal" value={f.lng} onChange={maj('lng')} hint="Ex. -4.0239" />
      </div>
      <ApiErrorAlert error={mutation.error} />
    </Modal>
  )
}
