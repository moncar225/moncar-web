import { Card, Badge } from '@/components/ui'
import type { StatCard, ActivityItem, EventItem } from '@/features/compagnie/mock/dashboard'

/** Bandeau signalant que les chiffres affichés sont des données mock. */
export function DemoNote() {
  return (
    <p className="demo-note">
      <span aria-hidden="true">⚠</span> Données de démonstration (mock) — aucune donnée
      réelle MON CAR. Le branchement backend attend le contrat OpenAPI.
    </p>
  )
}

interface DashboardSectionProps {
  stats: StatCard[]
  activity: ActivityItem[]
  events: EventItem[]
  /** Libellés des cartes selon l'espace (ex. « Voyages »). */
  activityTitle?: string
  eventsTitle?: string
}

/** Vue générale de démonstration : cartes de stats + activité + événements. */
export function DashboardSection({
  stats,
  activity,
  events,
  activityTitle = 'Activité récente',
  eventsTitle = 'Prochains événements',
}: DashboardSectionProps) {
  return (
    <>
      <DemoNote />

      <section className="page-section" aria-label="Vue générale">
        <h2 className="page-section__title">Vue générale</h2>
        <div className="stats-grid">
          {stats.map((stat) => (
            <Card key={stat.id}>
              <p className="stat-card__value">{stat.value}</p>
              <p className="stat-card__label">{stat.label}</p>
              <p className={`stat-card__delta stat-card__delta--${stat.deltaDirection}`}>
                {stat.deltaDirection === 'up' ? '▲' : '▼'} {stat.delta}{' '}
                <span className="sr-only">
                  {stat.deltaDirection === 'up' ? 'en hausse' : 'en baisse'}
                </span>
              </p>
            </Card>
          ))}
        </div>
      </section>

      <div className="stats-grid">
        <section className="page-section" aria-label={activityTitle}>
          <h2 className="page-section__title">{activityTitle}</h2>
          <Card>
            <ul className="timeline">
              {activity.map((item) => (
                <li key={item.id}>
                  <span className="timeline__time">{item.time}</span>
                  <span className="timeline__text">{item.text}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section className="page-section" aria-label={eventsTitle}>
          <h2 className="page-section__title">{eventsTitle}</h2>
          <Card>
            <ul className="timeline">
              {events.map((event) => (
                <li key={event.id}>
                  <Badge variant="accent">{event.time}</Badge>
                  <span className="timeline__text">{event.text}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>
    </>
  )
}
