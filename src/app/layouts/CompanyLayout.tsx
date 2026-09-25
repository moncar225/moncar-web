import { Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'
import { useAuth } from '../providers/AuthProvider'
import { NAV_COMPAGNIE } from '../navigation'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/** Layout de l'espace /compagnie (lazy loading) — menu filtré par permissions. */
export default function CompanyLayout() {
  useDocumentTitle('MON CAR — Espace Compagnie')
  const { session } = useAuth()
  const entite = session?.compagnie?.nom ?? null
  return (
    <AppShell
      espaceLabel="Espace Compagnie"
      navItems={NAV_COMPAGNIE}
      breadcrumb={[{ label: 'Accueil', to: '/' }, { label: 'Compagnie' }, ...(entite !== null ? [{ label: entite }] : [])]}
      title="Compagnie"
      user={session}
    >
      <Outlet />
    </AppShell>
  )
}
