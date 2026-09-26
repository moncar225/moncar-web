import { Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'
import { useAuth } from '../providers/AuthProvider'
import { NAV_ADMIN } from '../navigation'

/** Layout de l'espace /admin (lazy loading) — menu filtré par permissions. */
export default function AdminLayout() {
  const { session } = useAuth()
  return (
    <AppShell
      espaceLabel="Administration PROSOFT"
      navItems={NAV_ADMIN}
      racine="/admin"
      title="Administration"
      user={session}
    >
      <Outlet />
    </AppShell>
  )
}
