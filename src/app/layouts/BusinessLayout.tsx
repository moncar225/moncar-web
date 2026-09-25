import { Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'
import { useAuth } from '../providers/AuthProvider'
import { NAV_BUSINESS } from '../navigation'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/** Layout de l'espace /business (lazy loading) — menu filtré par permissions. */
export default function BusinessLayout() {
  useDocumentTitle('MON CAR — Espace Business')
  const { session } = useAuth()
  const entite = session?.fournisseur?.nom ?? null
  return (
    <AppShell
      espaceLabel="Espace Business"
      navItems={NAV_BUSINESS}
      breadcrumb={[{ label: 'Accueil', to: '/' }, { label: 'Business' }, ...(entite !== null ? [{ label: entite }] : [])]}
      title="Business"
      user={session}
    >
      <Outlet />
    </AppShell>
  )
}
