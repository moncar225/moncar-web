import { useState } from 'react'
import { Button, Card, Input, Select, Table, useToast } from '@/components/ui'
import type { CategorieVehicule, Ville } from '@/domain/types'
import { ApiErrorAlert, PageHeader, QueryView } from '@/features/shared/components/Page'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useCategories, useCreerCategorie, useCreerVille, useVilles } from '@/services/referentiels'

/** Référentiels communs à toute la plateforme (REF-001). */
export default function ReferentielsPage() {
  useDocumentTitle('MON CAR — Référentiels')
  return (
    <>
      <PageHeader
        title="Référentiels"
        description="Villes et catégories de véhicules utilisées par toutes les compagnies et tous les fournisseurs."
      />
      <div className="two-cols">
        <Villes />
        <Categories />
      </div>
    </>
  )
}

function Villes() {
  const villes = useVilles()
  const creer = useCreerVille()
  const { showToast } = useToast()
  const [nom, setNom] = useState('')
  const [region, setRegion] = useState('')
  return (
    <Card title="Villes et localités">
      <form
        className="toolbar"
        onSubmit={(e) => {
          e.preventDefault()
          creer.mutate(
            { nom, region },
            {
              onSuccess: () => {
                showToast('Ville ajoutée.', 'success')
                setNom('')
                setRegion('')
              },
            },
          )
        }}
      >
        <Input label="Nouvelle ville" value={nom} onChange={(e) => setNom(e.target.value)} />
        <Input label="Région" value={region} onChange={(e) => setRegion(e.target.value)} />
        <Button type="submit" disabled={nom === '' || region === ''} isLoading={creer.isPending}>
          Ajouter
        </Button>
      </form>
      <ApiErrorAlert error={creer.error} />
      <QueryView query={villes}>
        {(data) => (
          <Table<Ville>
            caption="Villes"
            rowKey={(v) => v.id}
            rows={[...data].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))}
            columns={[
              { key: 'nom', header: 'Ville' },
              { key: 'region', header: 'Région' },
            ]}
          />
        )}
      </QueryView>
    </Card>
  )
}

function Categories() {
  const categories = useCategories()
  const creer = useCreerCategorie()
  const { showToast } = useToast()
  const [nom, setNom] = useState('')
  const [usage, setUsage] = useState<CategorieVehicule['usage']>('transport')
  return (
    <Card title="Catégories de véhicules">
      <form
        className="toolbar"
        onSubmit={(e) => {
          e.preventDefault()
          creer.mutate(
            { nom, usage },
            {
              onSuccess: () => {
                showToast('Catégorie ajoutée.', 'success')
                setNom('')
              },
            },
          )
        }}
      >
        <Input label="Nouvelle catégorie" value={nom} onChange={(e) => setNom(e.target.value)} />
        <Select label="Usage" value={usage} onChange={(e) => setUsage(e.target.value as CategorieVehicule['usage'])}>
          <option value="transport">Transport de voyageurs</option>
          <option value="location">Location</option>
        </Select>
        <Button type="submit" disabled={nom === ''} isLoading={creer.isPending}>
          Ajouter
        </Button>
      </form>
      <ApiErrorAlert error={creer.error} />
      <QueryView query={categories}>
        {(data) => (
          <Table<CategorieVehicule>
            caption="Catégories"
            rowKey={(c) => c.id}
            rows={data}
            columns={[
              { key: 'nom', header: 'Catégorie' },
              { key: 'usage', header: 'Usage', render: (c) => (c.usage === 'transport' ? 'Transport' : 'Location') },
            ]}
          />
        )}
      </QueryView>
    </Card>
  )
}
