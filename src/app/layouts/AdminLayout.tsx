import { Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'
import { useAuth } from '../providers/AuthProvider'
import { NAV_ADMIN } from '../navigation'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/** Layout de l'espace /admin (lazy loading) — menu filtré par permissions. */
export default function AdminLayout() {
  useDocumentTitle('MON CAR — Administration PROSOFT')
  const { session } = useAuth()
  const entite = null
  return (
    <AppShell
      espaceLabel="Administration PROSOFT"
      navItems={NAV_ADMIN}
      breadcrumb={[{ label: 'Accueil', to: '/' }, { label: 'Administration' }, ...(entite !== null ? [{ label: entite }] : [])]}
      title="Administration"
      user={session}
    >
      <Outlet />
    </AppShell>
  )
}
