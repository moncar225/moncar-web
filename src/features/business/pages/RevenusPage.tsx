import { Alert, Button, Table } from '@/components/ui'
import { PageHeader, QueryView } from '@/features/shared/components/Page'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { fcfa, telechargerCsv } from '@/lib/format'
import { useRevenus } from '@/services/business'

/** Revenus du fournisseur : séquestre, règlements, commission (LOC-003). */
export default function RevenusPage() {
  useDocumentTitle('MON CAR — Revenus')
  const revenus = useRevenus()
  return (
    <>
      <PageHeader title="Revenus" description="Montants calculés par MON CAR à partir des paiements et des restitutions." />
      <QueryView query={revenus} loading="Revenus…">
        {(r) => (
          <div className="stack">
            <div className="kpis">
              <div className="kpi"><p className="kpi__label">En séquestre (locations non clôturées)</p><p className="kpi__value">{fcfa(r.enSequestre)}</p></div>
              <div className="kpi"><p className="kpi__label">Locations clôturées (brut)</p><p className="kpi__value">{fcfa(r.regleBrut)}</p></div>
              <div className="kpi"><p className="kpi__label">Commission MON CAR</p><p className="kpi__value">{r.tauxCommission} %</p></div>
              <div className="kpi"><p className="kpi__label">Réglé ou à régler (net)</p><p className="kpi__value">{fcfa(r.regleNet)}</p></div>
            </div>
            <Alert variant="info">
              Vous n’êtes pas réglé au paiement du client : les fonds sont libérés après la restitution validée (règles de
              séquestre soumises à l’avis juridique A-7).
            </Alert>
            <div className="row">
              <Button
                variant="outline"
                onClick={() =>
                  telechargerCsv('revenus_location.csv', [
                    ['Mois', 'Locations', 'Brut', 'Commission', 'Net'],
                    ...r.parMois.map((m) => [m.mois, m.locations, m.brut, m.commission, m.net]),
                  ])
                }
              >
                Exporter (CSV / Excel)
              </Button>
            </div>
            <Table
              caption="Revenus par mois"
              rowKey={(m) => m.mois}
              rows={r.parMois}
              columns={[
                { key: 'mois', header: 'Mois' },
                { key: 'locations', header: 'Locations', align: 'right' },
                { key: 'brut', header: 'Brut', align: 'right', render: (m) => fcfa(m.brut) },
                { key: 'commission', header: 'Commission', align: 'right', render: (m) => fcfa(m.commission) },
                { key: 'net', header: 'Net', align: 'right', render: (m) => <strong>{fcfa(m.net)}</strong> },
              ]}
            />
          </div>
        )}
      </QueryView>
    </>
  )
}
