import { useState } from 'react'
import { Badge, Button, Card, Input, Select, Table, useToast } from '@/components/ui'
import { ApiErrorAlert, PageHeader, QueryView } from '@/features/shared/components/Page'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { date, jourLocal } from '@/lib/format'
import { useAjouterIndispo, useDisponibilites, useSupprimerIndispo, useVehiculesLocation, type PeriodeIndispo } from '@/services/business'

const MOTIFS = { location: ['Location confirmée', 'primary'], maintenance: ['Maintenance', 'warning'], indisponible: ['Indisponible', 'neutral'] } as const

/** Calendrier de disponibilité des véhicules (LOC-002). */
export default function DisponibilitesPage() {
  useDocumentTitle('MON CAR — Disponibilités')
  const vehicules = useVehiculesLocation()
  const periodes = useDisponibilites()
  const ajouter = useAjouterIndispo()
  const supprimer = useSupprimerIndispo()
  const { showToast } = useToast()
  const [f, setF] = useState({ vehiculeId: '', debut: jourLocal(1), fin: jourLocal(2), motif: 'maintenance' as 'maintenance' | 'indisponible' })
  const titre = (id: string) => vehicules.data?.find((v) => v.id === id)?.titre ?? '—'
  return (
    <>
      <PageHeader title="Disponibilités" description="Un véhicule indisponible n’est pas proposé aux clients sur la période." />
      <Card title="Bloquer une période">
        <div className="toolbar">
          <Select label="Véhicule" value={f.vehiculeId} onChange={(e) => setF({ ...f, vehiculeId: e.target.value })}>
            <option value="">Choisir…</option>
            {vehicules.data?.map((v) => <option key={v.id} value={v.id}>{v.titre}</option>)}
          </Select>
          <Input label="Du" type="date" value={f.debut} onChange={(e) => setF({ ...f, debut: e.target.value })} />
          <Input label="Au" type="date" value={f.fin} onChange={(e) => setF({ ...f, fin: e.target.value })} />
          <Select label="Motif" value={f.motif} onChange={(e) => setF({ ...f, motif: e.target.value as typeof f.motif })}>
            <option value="maintenance">Maintenance</option>
            <option value="indisponible">Indisponible</option>
          </Select>
          <Button disabled={f.vehiculeId === ''} isLoading={ajouter.isPending} onClick={() => ajouter.mutate(f, { onSuccess: () => showToast('Période bloquée.', 'success') })}>
            Bloquer
          </Button>
        </div>
        <ApiErrorAlert error={ajouter.error ?? supprimer.error} />
      </Card>
      <QueryView query={periodes} loading="Calendrier…" isEmpty={(d) => d.length === 0}>
        {(data) => (
          <Table<PeriodeIndispo>
            caption="Périodes indisponibles"
            rowKey={(p) => p.id}
            rows={data}
            columns={[
              { key: 'vehicule', header: 'Véhicule', render: (p) => titre(p.vehiculeId) },
              { key: 'periode', header: 'Période', render: (p) => `${date(p.debut)} → ${date(p.fin)}` },
              { key: 'motif', header: 'Motif', render: (p) => <><Badge variant={MOTIFS[p.motif][1]}>{MOTIFS[p.motif][0]}</Badge>{p.demande !== undefined && <span className="muted"> {p.demande}</span>}</> },
              {
                key: 'actions',
                header: '',
                render: (p) => (p.motif === 'location' ? null : <Button size="sm" variant="ghost" onClick={() => supprimer.mutate(p.id)}>Libérer</Button>),
              },
            ]}
          />
        )}
      </QueryView>
    </>
  )
}
