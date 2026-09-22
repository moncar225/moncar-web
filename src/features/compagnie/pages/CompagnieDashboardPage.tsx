import { DashboardSection } from '@/features/shared/components/DashboardSection'
import { compagnieStats, compagnieActivity, compagnieEvents } from '@/features/compagnie/mock/dashboard'

/** Tableau de bord de démonstration — espace compagnie (données mock). */
export default function CompagnieDashboardPage() {
  return (
    <DashboardSection
      stats={compagnieStats}
      activity={compagnieActivity}
      events={compagnieEvents}
    />
  )
}
