import { DashboardSection } from '@/features/shared/components/DashboardSection'
import { businessStats, businessActivity } from '@/features/business/mock/dashboard'

/** Tableau de bord de démonstration — espace business (données mock). */
export default function BusinessDashboardPage() {
  return (
    <DashboardSection
      stats={businessStats}
      activity={businessActivity}
      events={[
        { id: 'be1', time: '12:00', text: 'Départ location avec chauffeur (mock)' },
        { id: 'be2', time: '16:30', text: 'Retour véhicule agence aéroport (mock)' },
      ]}
      activityTitle="Activité récente"
      eventsTitle="Prochains événements"
    />
  )
}
