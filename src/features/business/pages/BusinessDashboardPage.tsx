import { Link } from 'react-router-dom'
import { Alert, Card, Badge } from '@/components/ui'
import { PageHeader, QueryView } from '@/features/shared/components/Page'
import { StatutBadge } from '@/features/shared/labels'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { date, fcfa } from '@/lib/format'
import { useTableauBusiness } from '@/services/business'

/** Tableau de bord de l'agence / du propriétaire (espace BUSINESS). */
export default function BusinessDashboardPage() {
  useDocumentTitle('MON CAR — Espace Business')
  const tableau = useTableauBusiness()
  return (
    <>
      <PageHeader title="Vue générale" description="Vos véhicules, vos demandes et vos revenus de location." />
      <QueryView query={tableau} loading="Indicateurs…">
        {(t) => (
          <div className="stack">
            {t.fournisseur.statut !== 'validee' && (
              <Alert variant="warning">Votre compte est en cours de validation par PROSOFT : vous ne pouvez pas encore publier.</Alert>
            )}
            {t.fournisseur.vtc && <Alert variant="info">Compte VTC : vos véhicules VTC sont toujours proposés avec chauffeur.</Alert>}
            <div className="kpis">
              <div className="kpi"><p className="kpi__label">Véhicules publiés</p><p className="kpi__value">{t.vehiculesPublies} / {t.vehicules}</p></div>
              <div className="kpi"><p className="kpi__label">Demandes à traiter</p><p className="kpi__value">{t.demandesATraiter}</p></div>
              <div className="kpi"><p className="kpi__label">Locations confirmées</p><p className="kpi__value">{t.locationsEnCours}</p></div>
              <div className="kpi"><p className="kpi__label">En séquestre MON CAR</p><p className="kpi__value">{fcfa(t.revenus.enSequestre)}</p></div>
              <div className="kpi"><p className="kpi__label">Réglé (net)</p><p className="kpi__value">{fcfa(t.revenus.regleNet)}</p></div>
            </div>
            {t.demandesATraiter > 0 && (
              <Alert variant="warning">
                {t.demandesATraiter} demande(s) attendent votre réponse. <Link to="/business/demandes">Répondre</Link>
              </Alert>
            )}
            <Card title="Prochaines locations">
              <ul className="list-plain">
                {t.prochaines.map((d) => (
                  <li key={d.id} className="row row--between">
                    <span>
                      <strong>{d.vehicule}</strong> — {d.client.nom}
                      <br />
                      <span className="muted">{date(d.debut)} → {date(d.fin)} · {d.avecChauffeur ? 'avec chauffeur' : 'sans chauffeur'}</span>
                    </span>
                    <span className="row">
                      <Badge>{fcfa(d.montant)}</Badge>
                      <StatutBadge table="demande" statut={d.statut} />
                    </span>
                  </li>
                ))}
                {t.prochaines.length === 0 && <li className="muted">Aucune location à venir.</li>}
              </ul>
            </Card>
          </div>
        )}
      </QueryView>
    </>
  )
}
