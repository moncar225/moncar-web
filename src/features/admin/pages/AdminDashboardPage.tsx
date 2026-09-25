import { Link } from 'react-router-dom'
import { Alert, Card } from '@/components/ui'
import { useCan } from '@/app/permissions'
import { PageHeader, QueryView } from '@/features/shared/components/Page'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { entier, fcfa } from '@/lib/format'
import { useTableauAdmin } from '@/services/plateforme'

/** Tableau de bord PROSOFT : partenaires, volume, commissions, files de travail. */
export default function AdminDashboardPage() {
  useDocumentTitle('MON CAR — Administration')
  const tableau = useTableauAdmin()
  const can = useCan()
  return (
    <>
      <PageHeader title="Vue générale" description="Plateforme MON CAR — toutes compagnies et tous fournisseurs." />
      <QueryView query={tableau} loading="Indicateurs de la plateforme…">
        {(t) => (
          <div className="stack">
            <div className="kpis">
              <div className="kpi"><p className="kpi__label">Compagnies actives</p><p className="kpi__value">{t.compagniesValidees}</p></div>
              <div className="kpi"><p className="kpi__label">Fournisseurs BUSINESS</p><p className="kpi__value">{t.fournisseurs}</p></div>
              <div className="kpi"><p className="kpi__label">Billets vendus</p><p className="kpi__value">{entier(t.billetsVendus)}</p></div>
              <div className="kpi"><p className="kpi__label">Volume des ventes</p><p className="kpi__value">{fcfa(t.volumeVentes)}</p></div>
              <div className="kpi"><p className="kpi__label">Commissions PROSOFT</p><p className="kpi__value">{fcfa(t.commissions)}</p></div>
            </div>
            <Card title="Files de travail">
              <div className="stack">
                {t.dossiersEnAttente > 0 && (
                  <Alert variant="warning">
                    {t.dossiersEnAttente} partenaire(s) en attente de validation.{' '}
                    {can('admin.compagnies.valider') && <Link to="/admin/validation">Examiner</Link>}
                  </Alert>
                )}
                {t.promotionsAValider > 0 && (
                  <Alert variant="warning">
                    {t.promotionsAValider} promotion(s) à valider.{' '}
                    {can('admin.promotions.valider') && <Link to="/admin/promotions">Traiter</Link>}
                  </Alert>
                )}
                {t.litigesOuverts > 0 && (
                  <Alert variant="info">
                    {t.litigesOuverts} litige(s) ouvert(s).{' '}
                    {can('admin.litiges.traiter') && <Link to="/admin/litiges">Instruire</Link>}
                  </Alert>
                )}
                {t.ecartsRapprochement > 0 && (
                  <Alert variant="danger">{t.ecartsRapprochement} écart(s) de rapprochement avec le prestataire de paiement.</Alert>
                )}
                {t.dossiersEnAttente + t.promotionsAValider + t.litigesOuverts + t.ecartsRapprochement === 0 && (
                  <p className="muted">Aucune tâche en attente.</p>
                )}
              </div>
            </Card>
          </div>
        )}
      </QueryView>
    </>
  )
}
