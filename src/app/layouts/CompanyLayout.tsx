import { Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'
import { useAuth } from '../providers/AuthProvider'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const navItems = [
  { id: 'dashboard', label: 'Tableau de bord', to: '/compagnie' },
  { id: 'voyages', label: 'Voyages', to: '/compagnie/voyages' },
  { id: 'reservations', label: 'Réservations', to: '/compagnie/reservations' },
  { id: 'vehicules', label: 'Véhicules', to: '/compagnie/vehicules' },
  { id: 'personnel', label: 'Personnel', to: '/compagnie/personnel' },
  { id: 'parametres', label: 'Paramètres', to: '/compagnie/parametres' },
]

/** Layout de l'espace /compagnie (lazy loading). */
export default function CompanyLayout() {
  useDocumentTitle('MON CAR — Espace Compagnie')
  const { session } = useAuth()
  return (
    <AppShell
      espaceLabel="Espace Compagnie"
      navItems={navItems}
      breadcrumb={[{ label: 'Accueil', to: '/' }, { label: 'Compagnie' }]}
      title="Compagnie"
      user={session}
    >
      <Outlet />
    </AppShell>
  )
}
