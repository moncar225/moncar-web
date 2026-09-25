import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import type { BreadcrumbItem } from '@/components/ui/Breadcrumb'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
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
  navItems: ShellNavItem[]
  breadcrumb: BreadcrumbItem[]
  /** Titre de la page dans la barre supérieure. */
  title: string
  /** Actions à droite de la barre (sélecteur d'entité…). */
  actions?: ReactNode
  /** Utilisateur de la session (avatar dans la topbar). */
  user: SessionUser | null
  children: ReactNode
}

/**
 * Shell commun des espaces protégés MON CAR : sidebar bleue (identité),
 * topbar blanche (espace + lisibilité), breadcrumb, contenu.
 * Responsive : la sidebar devient un drawer sous 1024px.
 */
export function AppShell({
  espaceLabel,
  navItems,
  breadcrumb,
  title,
  actions,
  user,
  children,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { logout } = useAuth()
  const visibles = navItems.filter(
    (item) => item.permission === undefined || (user?.permissions?.includes(item.permission) ?? false),
  )
  const entite = user?.gare?.nom ?? user?.compagnie?.nom ?? user?.fournisseur?.nom ?? null

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
        <strong>MON CAR</strong>
      </div>
      <p className="sidebar__space">{espaceLabel}</p>
      <nav aria-label={`Navigation ${espaceLabel}`}>
        <ul>
          {visibles.map((item) => (
            <li key={item.id}>
              <NavLink
                to={item.to}
                end
                className={({ isActive }) =>
                  `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {env.enableMocks && (
        <div className="sidebar__demo">
          <Button size="sm" variant="ghost" onClick={() => void reinitialiserDemo()}>
            Réinitialiser la démo
          </Button>
        </div>
      )}
      <p className="sidebar__footer">
        {env.enableMocks ? 'Données de démonstration (faux backend) — API MON CAR à venir.' : `Environnement ${env.appEnvLabel}`}
      </p>
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="topbar__title">{title}</h1>
          {actions}
          {user !== null && (
            <div className="topbar__user">
              <div>
                {user.fullName}
                <small>
                  {user.posteLibelle ?? ''}
                  {entite !== null ? ` · ${entite}` : ''}
                </small>
              </div>
              <Avatar name={user.fullName} size="sm" />
              <Button size="sm" variant="outline" onClick={logout}>
                Déconnexion
              </Button>
            </div>
          )}
        </header>

        <div className="shell__content">
          <Breadcrumb items={breadcrumb} />
          <div style={{ marginTop: 'var(--mc-space-4)' }}>{children}</div>
        </div>
      </div>
    </div>
  )
}
