import { useState } from 'react'
import { Alert, Badge, Button, Input, Select, Table, Tabs } from '@/components/ui'
import { Can } from '@/app/permissions'
import type { Ecriture, Rapprochement, Reversement } from '@/domain/types'
import { PageHeader, QueryView } from '@/features/shared/components/Page'
import { MOYENS } from '@/features/shared/labels'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { date, dateHeure, fcfa, jourLocal, telechargerCsv } from '@/lib/format'
import { useEcritures, useRapprochements, useReversements, useSynthese } from '@/services/plateforme'

const JOURNAUX: Record<Ecriture['journal'], string> = {
  vente: 'Ventes en ligne',
  caisse: 'Caisse',
  commission: 'Commissions',
  reversement: 'Reversements',
  remboursement: 'Remboursements',
  location: 'Location',
}

/** Responsable financier : synthèse, grand livre (lecture), reversements, rapprochements. */
export default function FinancesPage() {
  useDocumentTitle('MON CAR — Finances')
  const [onglet, setOnglet] = useState('synthese')
  return (
    <>
      <PageHeader title="Finances" description="Soldes calculés à partir des écritures (jamais saisis). Lecture seule." />
      <Tabs
        ariaLabel="Rubrique financière"
        tabs={[
          { id: 'synthese', label: 'Synthèse' },
          { id: 'ecritures', label: 'Écritures' },
          { id: 'reversements', label: 'Reversements' },
          { id: 'rapprochements', label: 'Rapprochements' },
        ]}
        active={onglet}
        onChange={setOnglet}
      >
        {onglet === 'synthese' && <Synthese />}
        {onglet === 'ecritures' && <Ecritures />}
        {onglet === 'reversements' && <Reversements />}
        {onglet === 'rapprochements' && <Rapprochements />}
      </Tabs>
    </>
  )
}

function Synthese() {
  const synthese = useSynthese()
  return (
    <QueryView query={synthese} loading="Calcul de la synthèse…">
      {(s) => (
        <>
          <div className="kpis">
            <div className="kpi"><p className="kpi__label">Ventes en ligne (encaissées par MON CAR)</p><p className="kpi__value">{fcfa(s.ventesApp)}</p></div>
            <div className="kpi"><p className="kpi__label">Ventes guichet (encaissées en gare)</p><p className="kpi__value">{fcfa(s.ventesGuichet)}</p></div>
            <div className="kpi"><p className="kpi__label">Commissions PROSOFT</p><p className="kpi__value">{fcfa(s.commissions)}</p></div>
            <div className="kpi"><p className="kpi__label">Remboursements</p><p className="kpi__value">{fcfa(s.remboursements)}</p></div>
            <div className="kpi"><p className="kpi__label">Déjà reversé</p><p className="kpi__value">{fcfa(s.dejaReverse)}</p></div>
            <div className="kpi"><p className="kpi__label">Solde dû par MON CAR</p><p className="kpi__value">{fcfa(s.soldeDuParMonCar)}</p></div>
          </div>
          <Alert variant="info">
            Solde = ventes en ligne − commissions − remboursements − reversements effectués. Périodicité et règles de
            reversement : arbitrage A-4 en attente.
          </Alert>
        </>
      )}
    </QueryView>
  )
}

function Ecritures() {
  const [du, setDu] = useState(jourLocal(-7))
  const [au, setAu] = useState(jourLocal())
  const [journal, setJournal] = useState('')
  const ecritures = useEcritures(du, au, journal)
  return (
    <>
      <div className="toolbar">
        <Input label="Du" type="date" value={du} onChange={(e) => setDu(e.target.value)} />
        <Input label="Au" type="date" value={au} onChange={(e) => setAu(e.target.value)} />
        <Select label="Journal" value={journal} onChange={(e) => setJournal(e.target.value)}>
          <option value="">Tous</option>
          {Object.entries(JOURNAUX).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Can permission="finances.exporter" mode="disable">
          {(autorise, motif) => (
            <Button
              variant="outline"
              disabled={!autorise || ecritures.data === undefined}
              title={autorise ? undefined : motif}
              onClick={() =>
                telechargerCsv(`ecritures_${du}_${au}.csv`, [
                  ['Date', 'Journal', 'Libellé', 'Débit', 'Crédit', 'Montant', 'Référence'],
                  ...(ecritures.data ?? []).map((e) => [dateHeure(e.date), JOURNAUX[e.journal], e.libelle, e.compteDebit, e.compteCredit, e.montant, e.reference]),
                ])
              }
            >
              Exporter (CSV / Excel)
            </Button>
          )}
        </Can>
      </div>
      <QueryView query={ecritures} loading="Lecture du grand livre…" isEmpty={(d) => d.length === 0}>
        {(data) => (
          <>
            <p className="muted">
              {data.length} écriture(s) — total {fcfa(data.reduce((s, e) => s + e.montant, 0))}. Écritures immuables : une
              correction se fait par écriture inverse.
            </p>
            <Table<Ecriture>
              caption="Écritures comptables"
              rowKey={(e) => e.id}
              rows={data.slice(0, 200)}
              columns={[
                { key: 'date', header: 'Date', render: (e) => dateHeure(e.date) },
                { key: 'journal', header: 'Journal', render: (e) => <Badge variant={e.journal === 'remboursement' ? 'danger' : e.journal === 'commission' ? 'accent' : 'neutral'}>{JOURNAUX[e.journal]}</Badge> },
                { key: 'libelle', header: 'Libellé' },
                { key: 'comptes', header: 'Débit → crédit', render: (e) => <span className="muted">{e.compteDebit} → {e.compteCredit}</span> },
                { key: 'montant', header: 'Montant', align: 'right', render: (e) => fcfa(e.montant) },
              ]}
            />
          </>
        )}
      </QueryView>
    </>
  )
}

function Reversements() {
  const reversements = useReversements()
  return (
    <QueryView query={reversements} loading="Reversements…" isEmpty={(d) => d.length === 0}>
      {(data) => (
        <Table<Reversement>
          caption="États de reversement"
          rowKey={(r) => r.id}
          rows={data}
          columns={[
            { key: 'periode', header: 'Période' },
            { key: 'brut', header: 'Ventes', align: 'right', render: (r) => fcfa(r.montantBrut) },
            { key: 'commission', header: 'Commission', align: 'right', render: (r) => fcfa(r.commission) },
            { key: 'net', header: 'Net reversé', align: 'right', render: (r) => <strong>{fcfa(r.montantNet)}</strong> },
            { key: 'echeance', header: 'Échéance', render: (r) => date(r.echeance) },
            { key: 'statut', header: 'Statut', render: (r) => (r.statut === 'paye' ? <Badge variant="success">Payé le {date(r.payeLe ?? r.echeance)}</Badge> : <Badge variant="warning">À payer</Badge>) },
          ]}
        />
      )}
    </QueryView>
  )
}

function Rapprochements() {
  const rapprochements = useRapprochements()
  return (
    <QueryView query={rapprochements} loading="Rapprochements…" isEmpty={(d) => d.length === 0}>
      {(data) => (
        <>
          {data.some((r) => r.statut === 'ecart') && (
            <Alert variant="warning">Des écarts sont listés : ils sont investigués, jamais corrigés à l’aveugle.</Alert>
          )}
          <Table<Rapprochement>
            caption="Rapprochement quotidien avec le prestataire de paiement"
            rowKey={(r) => r.id}
            rows={data}
            columns={[
              { key: 'date', header: 'Jour', render: (r) => date(r.date) },
              { key: 'ref', header: 'Référence prestataire', render: (r) => <>{r.referencePrestataire}<br /><span className="muted">{MOYENS[r.moyen]}</span></> },
              { key: 'presta', header: 'Prestataire', align: 'right', render: (r) => fcfa(r.montantPrestataire) },
              { key: 'moncar', header: 'MON CAR', align: 'right', render: (r) => fcfa(r.montantMonCar) },
              { key: 'statut', header: 'Résultat', render: (r) => (r.statut === 'ok' ? <Badge variant="success">Concordant</Badge> : <Badge variant="danger">Écart {fcfa(r.montantPrestataire - r.montantMonCar)}</Badge>) },
            ]}
          />
        </>
      )}
    </QueryView>
  )
}
