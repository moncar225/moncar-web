import { Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'
import { useAuth } from '../providers/AuthProvider'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', to: '/admin' },
  { id: 'utilisateurs', label: 'Utilisateurs', to: '/admin/utilisateurs' },
  { id: 'compagnies', label: 'Compagnies', to: '/admin/compagnies' },
  { id: 'business', label: 'Business', to: '/admin/business' },
  { id: 'audit', label: 'Audit', to: '/admin/audit' },
  { id: 'parametres', label: 'Paramètres', to: '/admin/parametres' },
]

/** Layout de l'espace /admin (lazy loading). */
export default function AdminLayout() {
  useDocumentTitle('MON CAR — Administration')
  const { session } = useAuth()
  return (
    <AppShell
      espaceLabel="Administration"
      navItems={navItems}
      breadcrumb={[{ label: 'Accueil', to: '/' }, { label: 'Administration' }]}
      title="Administration"
      user={session}
    >
      <Outlet />
    </AppShell>
  )
}
