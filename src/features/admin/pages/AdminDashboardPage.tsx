import { DashboardSection } from '@/features/shared/components/DashboardSection'
import { adminStats, adminActivity } from '@/features/admin/mock/dashboard'

/** Tableau de bord de démonstration — administration (données mock). */
export default function AdminDashboardPage() {
  return (
    <DashboardSection
      stats={adminStats}
      activity={adminActivity}
      events={[
        { id: 'ae1', time: '15:00', text: 'Rapport hebdomadaire à générer (mock)' },
        { id: 'ae2', time: '18:00', text: 'Sauvegarde planifiée (mock)' },
      ]}
      activityTitle="Activité récente"
      eventsTitle="Prochains événements"
    />
  )
}
