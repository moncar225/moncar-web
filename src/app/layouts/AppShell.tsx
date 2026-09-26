import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import type { BreadcrumbItem } from '@/components/ui/Breadcrumb'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown } from '@/components/ui/Dropdown'
import { Icon, isIconName } from '@/components/ui/Icon'
import type { Permission } from '@/domain/permissions'
import { env } from '@/lib/env'
import { httpClient } from '@/api/client'
import type { SessionUser } from '@/types/auth'
import { useAuth } from '../providers/AuthProvider'

export interface ShellNavItem {
  id: string
  label: string
  /** Chemin absolu de la page (ex. « /compagnie »). */
  to: string
  /** Permission requise : l'entrée est masquée sans elle (le serveur vérifie aussi). */
  permission?: Permission
}

interface AppShellProps {
  /** Nom de l'espace affiché sous la marque dans la sidebar. */
  espaceLabel: string
  /** Racine de l'espace (ex. « /compagnie »), cible du fil d'Ariane. */
  racine: string
  navItems: ShellNavItem[]
  /** Titre de l'espace dans la barre supérieure. */
  title: string
  /** Actions à droite de la barre (sélecteur d'entité…). */
  actions?: ReactNode
  /** Utilisateur de la session (menu utilisateur de la topbar). */
  user: SessionUser | null
  children: ReactNode
}

/**
 * Shell commun des espaces protégés MON CAR : sidebar bleu nuit (identité),
 * topbar blanche (espace, entité, utilisateur), fil d'Ariane, contenu.
 * Responsive : la sidebar devient un drawer sous 1024px.
 */
export function AppShell({ espaceLabel, racine, navItems, title, actions, user, children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { logout } = useAuth()
  const { pathname } = useLocation()
  const visibles = navItems.filter(
    (item) => item.permission === undefined || (user?.permissions?.includes(item.permission) ?? false),
  )
  const entite = [user?.compagnie?.nom ?? user?.fournisseur?.nom, user?.gare?.nom].filter(Boolean).join(' · ')
  const courante = visibles.find((item) => item.to === pathname)
  const breadcrumb: BreadcrumbItem[] = [
    { label: 'Accueil', to: '/' },
    { label: title, to: racine },
    ...(courante !== undefined && courante.to !== racine ? [{ label: courante.label }] : []),
  ]

  async function reinitialiserDemo() {
    await httpClient.post('/demo/reinitialisation', { skipIdempotency: true })
    window.location.reload()
  }

  // Ferme le drawer si la fenêtre repasse en desktop.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setDrawerOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const nav = (
    <>
      <div className="sidebar__brand">
        <img src="/brand/logo.png" alt="Logo MON CAR" />
        <div>
          <strong>MON CAR</strong>
          <span>{espaceLabel}</span>
        </div>
      </div>
      <nav className="sidebar__nav" aria-label={`Navigation ${espaceLabel}`}>
        <p className="sidebar__section" aria-hidden="true">
          Menu
        </p>
        <ul>
          {visibles.map((item) => (
            <li key={item.id}>
              <NavLink
                to={item.to}
                end
                onClick={() => setDrawerOpen(false)}
                className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
              >
                {isIconName(item.id) && <Icon name={item.id} size={18} />}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar__footer">
        {env.enableMocks ? (
          <>
            <p>
              <span className="sidebar__pulse" aria-hidden="true" />
              Données de démonstration
            </p>
            <button type="button" className="sidebar__demo" onClick={() => void reinitialiserDemo()}>
              <Icon name="refresh" size={14} />
              Réinitialiser la démo
            </button>
          </>
        ) : (
          <p>Environnement {env.appEnvLabel}</p>
        )}
      </div>
    </>
  )

  return (
    <div className="shell">
      <aside className="sidebar">{nav}</aside>

      {drawerOpen && (
        <>
          <button
            type="button"
            className="drawer-overlay"
            aria-label="Fermer le menu de navigation"
            onClick={() => setDrawerOpen(false)}
          />
          <aside id="sidebar-drawer" className="sidebar sidebar--drawer">
            {nav}
          </aside>
        </>
      )}

      <div className="shell__main">
        <header className="topbar">
          <button
            type="button"
            className="topbar__burger"
            aria-expanded={drawerOpen}
            aria-controls="sidebar-drawer"
            aria-label="Ouvrir le menu de navigation"
            onClick={() => setDrawerOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <div className="topbar__heading">
            <h1 className="topbar__title">{title}</h1>
            {entite !== '' && <p className="topbar__entite">{entite}</p>}
          </div>
          {actions}
          {user !== null && (
            <Dropdown
              align="right"
              triggerClassName="topbar__user"
              triggerLabel={`Compte de ${user.fullName}`}
              trigger={
                <>
                  <Avatar name={user.fullName} size="sm" />
                  <span className="topbar__user-text">
                    {user.fullName}
                    {user.posteLibelle !== undefined && <small>{user.posteLibelle}</small>}
                  </span>
                  <Icon name="chevronDown" size={16} />
                </>
              }
              header={
                <>
                  <strong>{user.fullName}</strong>
                  <span>{[user.posteLibelle, entite].filter(Boolean).join(' · ')}</span>
                </>
              }
              items={[{ label: 'Déconnexion', onSelect: logout }]}
            />
          )}
        </header>

        <div className="shell__content">
          <Breadcrumb items={breadcrumb} />
          <div className="shell__page">{children}</div>
        </div>
      </div>
    </div>
  )
}
