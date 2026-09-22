import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'
import { useAuth } from '../providers/AuthProvider'
import { Dropdown } from '@/components/ui'
import { businessEntities } from '@/features/business/mock/dashboard'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const navItems = [
  { id: 'dashboard', label: 'Tableau de bord', to: '/business' },
  { id: 'locations', label: 'Locations', to: '/business/locations' },
  { id: 'vehicules', label: 'Véhicules', to: '/business/vehicules' },
  { id: 'demandes', label: 'Demandes', to: '/business/demandes' },
  { id: 'parametres', label: 'Paramètres', to: '/business/parametres' },
]

/** Layout de l'espace /business (lazy) avec sélecteur d'entité (mock). */
export default function BusinessLayout() {
  useDocumentTitle('MON CAR — Espace Business')
  const { session } = useAuth()
  const [entity, setEntity] = useState(businessEntities[0])

  return (
    <AppShell
      espaceLabel="Espace Business"
      navItems={navItems}
      breadcrumb={[{ label: 'Accueil', to: '/' }, { label: 'Business' }, { label: entity.name }]}
      title="Business"
      actions={
        <Dropdown
          align="right"
          trigger={entity.name}
          items={businessEntities.map((businessEntity) => ({
            label: `${businessEntity.name} — ${businessEntity.type}`,
            onSelect: () => setEntity(businessEntity),
          }))}
        />
      }
      user={session}
    >
      <Outlet />
    </AppShell>
  )
}
