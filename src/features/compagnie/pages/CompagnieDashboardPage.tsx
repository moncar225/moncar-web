import { Link } from 'react-router-dom'
import { Alert, Card } from '@/components/ui'
import { PageHeader, QueryView } from '@/features/shared/components/Page'
import { StatutBadge } from '@/features/shared/labels'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { date, fcfa, heure } from '@/lib/format'
import { useTableauCompagnie, type TableauCompagnie } from '@/services/plateforme'

/** Tableau de bord consolidé du directeur général (roadmap §11.1). */
export default function CompagnieDashboardPage() {
  useDocumentTitle('MON CAR — Tableau de bord')
  const tableau = useTableauCompagnie()
  return (
    <>
      <PageHeader title="Tableau de bord" description="Activité du jour, ventes des 14 derniers jours et points d’attention." />
      <QueryView query={tableau} loading="Calcul des indicateurs…">
        {(t) => <Contenu t={t} />}
      </QueryView>
    </>
  )
}

export function BarresVentes({ serie }: { serie: TableauCompagnie['serie'] }) {
  const max = Math.max(1, ...serie.map((s) => s.app + s.guichet))
  return (
    <figure className="figure">
      <div className="barres" role="img" aria-label="Ventes par jour, application et guichet">
        {serie.map((s) => (
          <div key={s.jour} className="barres__col" title={`${date(`${s.jour}T12:00:00`)} : application ${fcfa(s.app)}, guichet ${fcfa(s.guichet)}`}>
            <span className="barres__seg--app" style={{ height: `${(s.app / max) * 100}%` }} />
            <span className="barres__seg--guichet" style={{ height: `${(s.guichet / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="barres__jours" aria-hidden="true">
        {serie.map((s) => <span key={s.jour}>{s.jour.slice(8, 10)}</span>)}
      </div>
      <figcaption className="legende-barres">
        <span>Application</span>
        <span className="guichet">Guichet</span>
      </figcaption>
    </figure>
  )
}

function Contenu({ t }: { t: TableauCompagnie }) {
  return (
    <div className="stack">
      <div className="kpis">
        <div className="kpi"><p className="kpi__label">Voyages aujourd’hui</p><p className="kpi__value">{t.voyagesDuJour}</p></div>
        <div className="kpi"><p className="kpi__label">En route</p><p className="kpi__value">{t.enRoute}</p></div>
        <div className="kpi"><p className="kpi__label">Billets vendus aujourd’hui</p><p className="kpi__value">{t.billetsDuJour}</p></div>
        <div className="kpi"><p className="kpi__label">Recettes du jour</p><p className="kpi__value">{fcfa(t.recettesDuJour)}</p></div>
        <div className="kpi"><p className="kpi__label">Remplissage moyen</p><p className="kpi__value">{Math.round(t.remplissageMoyen * 100)} %</p></div>
        <div className="kpi"><p className="kpi__label">Colis en cours</p><p className="kpi__value">{t.colisEnCours}</p></div>
      </div>
      <div className="split">
        <Card title="Ventes des 14 derniers jours">
          <BarresVentes serie={t.serie} />
        </Card>
        <div className="stack">
          <Card title="Points d’attention">
            {t.alertes.length === 0 ? (
              <p className="muted">Rien à signaler.</p>
            ) : (
              <div className="stack">
                {t.alertes.map((a) => <Alert key={a} variant="warning">{a}</Alert>)}
              </div>
            )}
          </Card>
          <Card title="Prochains départs" headerAction={<Link to="/compagnie/planning">Planning</Link>}>
            <ul className="list-plain">
              {t.prochainsDeparts.map((d) => (
                <li key={d.id} className="row row--between">
                  <span><strong>{heure(d.depart)}</strong> {d.ligne}</span>
                  <StatutBadge table="voyage" statut={d.statut} />
                </li>
              ))}
              {t.prochainsDeparts.length === 0 && <li className="muted">Plus de départ aujourd’hui.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
