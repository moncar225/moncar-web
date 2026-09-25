import { lazy, Suspense } from 'react'
import type { ComponentType, LazyExoticComponent, ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { AppProviders } from '../providers/AppProviders'
import { useAuth } from '../providers/AuthProvider'
import { NAV_ADMIN, NAV_BUSINESS, NAV_COMPAGNIE } from '../navigation'
import type { ShellNavItem } from '../layouts/AppShell'
import { RequirePermission } from '../permissions'
import { ProtectedRoute } from './ProtectedRoute'
import { PageLoader } from '@/components/PageLoader'
import { HomePage } from '@/features/home/pages/HomePage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { PasswordChangePage } from '@/features/auth/pages/PasswordChangePage'
import { ForbiddenPage } from '@/features/errors/pages/ForbiddenPage'
import { NotFoundPage } from '@/features/errors/pages/NotFoundPage'
import { PlaceholderPage } from '@/features/shared/pages/PlaceholderPage'
import { env } from '@/lib/env'
import type { SessionUser } from '@/types/auth'

// Lazy loading : chaque espace (layout + pages) est un chunk séparé.
const CompanyLayout = lazy(() => import('../layouts/CompanyLayout'))
const BusinessLayout = lazy(() => import('../layouts/BusinessLayout'))
const AdminLayout = lazy(() => import('../layouts/AdminLayout'))

const CompagnieDashboardPage = lazy(() => import('@/features/compagnie/pages/CompagnieDashboardPage'))
const BusinessDashboardPage = lazy(() => import('@/features/business/pages/BusinessDashboardPage'))
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage'))
const CataloguePage = lazy(() => import('@/features/catalogue/pages/CataloguePage'))

type Page = LazyExoticComponent<ComponentType>

/** Pages métier par espace (id de rubrique → page) ; absente = page d'attente. */
const PAGES_COMPAGNIE: Record<string, Page> = {}
const PAGES_ADMIN: Record<string, Page> = {}
const PAGES_BUSINESS: Record<string, Page> = {}

function lazyElement(node: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>
}

/** Index d'un espace : tableau de bord si autorisé, sinon 1re rubrique permise. */
function SpaceIndex({ nav, dashboard }: { nav: ShellNavItem[]; dashboard: ReactNode }) {
  const { session } = useAuth()
  const permises = nav.filter(
    (i) => i.permission === undefined || (session?.permissions?.includes(i.permission) ?? false),
  )
  const index = nav[0]
  if (index !== undefined && permises.includes(index)) return lazyElement(dashboard)
  const premiere = permises[0]
  return premiere === undefined ? <Navigate to="/403" replace /> : <Navigate to={premiere.to} replace />
}

function spaceChildren(nav: ShellNavItem[], dashboard: ReactNode, pages: Record<string, Page>): RouteObject[] {
  return [
    { index: true, element: <SpaceIndex nav={nav} dashboard={dashboard} /> },
    ...nav.slice(1).map((item) => {
      const Composant = pages[item.id]
      const contenu =
        Composant === undefined ? <PlaceholderPage title={item.label} /> : lazyElement(<Composant />)
      return {
        path: item.id,
        element:
          item.permission === undefined ? (
            contenu
          ) : (
            <RequirePermission permission={item.permission}>{contenu}</RequirePermission>
          ),
      }
    }),
  ]
}

export interface CreateAppRoutesOptions {
  /** Seam de test — voir `AuthProvider`. Aucune requête émise. */
  initialSession?: SessionUser | null
}

/** Arbre de routes de moncar-web (utilisé par le navigateur ET les tests). */
export function createAppRoutes(options: CreateAppRoutesOptions = {}): RouteObject[] {
  return [
    {
      element: (
        <AppProviders initialSession={options.initialSession}>
          <Outlet />
        </AppProviders>
      ),
      children: [
        { path: '/', element: <HomePage /> },
        { path: '/connexion', element: <LoginPage /> },
        { path: '/mot-de-passe', element: <PasswordChangePage /> },
        { path: '/403', element: <ForbiddenPage /> },
        // Catalogue du design system : dev et recette uniquement.
        ...(env.isProd ? [] : [{ path: '/catalogue', element: lazyElement(<CataloguePage />) }]),
        {
          path: '/compagnie',
          element: <ProtectedRoute requiredRole="compagnie">{lazyElement(<CompanyLayout />)}</ProtectedRoute>,
          children: spaceChildren(NAV_COMPAGNIE, <CompagnieDashboardPage />, PAGES_COMPAGNIE),
        },
        {
          path: '/business',
          element: <ProtectedRoute requiredRole="business">{lazyElement(<BusinessLayout />)}</ProtectedRoute>,
          children: spaceChildren(NAV_BUSINESS, <BusinessDashboardPage />, PAGES_BUSINESS),
        },
        {
          path: '/admin',
          element: <ProtectedRoute requiredRole="admin">{lazyElement(<AdminLayout />)}</ProtectedRoute>,
          children: spaceChildren(NAV_ADMIN, <AdminDashboardPage />, PAGES_ADMIN),
        },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ]
}
