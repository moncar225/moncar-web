import { Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'
import { useAuth } from '../providers/AuthProvider'
import { NAV_BUSINESS } from '../navigation'

/** Layout de l'espace /business (lazy loading) — menu filtré par permissions. */
export default function BusinessLayout() {
  const { session } = useAuth()
  return (
    <AppShell
      espaceLabel="Espace Business"
      navItems={NAV_BUSINESS}
      racine="/business"
      title="Business"
      user={session}
    >
      <Outlet />
    </AppShell>
  )
}
