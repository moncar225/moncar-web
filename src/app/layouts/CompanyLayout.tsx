import { Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'
import { useAuth } from '../providers/AuthProvider'
import { NAV_COMPAGNIE } from '../navigation'

/** Layout de l'espace /compagnie (lazy loading) — menu filtré par permissions. */
export default function CompanyLayout() {
  const { session } = useAuth()
  return (
    <AppShell
      espaceLabel="Espace Compagnie"
      navItems={NAV_COMPAGNIE}
      racine="/compagnie"
      title="Compagnie"
      user={session}
    >
      <Outlet />
    </AppShell>
  )
}
