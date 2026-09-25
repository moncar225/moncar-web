import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { AppProviders } from '../providers/AppProviders'
import { ProtectedRoute } from './ProtectedRoute'
import { PageLoader } from '@/components/PageLoader'
import { HomePage } from '@/features/home/pages/HomePage'
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

function lazyElement(node: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>
}

/** Enfants UI-only d'un espace : dashboard en index + rubriques en attente. */
function spaceChildren(dashboard: ReactNode, sections: string[]): RouteObject[] {
  return [
    { index: true, element: lazyElement(dashboard) },
    ...sections.map((section) => ({
      path: section,
      element: <PlaceholderPage title={section} />,
    })),
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
        { path: '/403', element: <ForbiddenPage /> },
        // Catalogue du design system : dev et recette uniquement.
        ...(env.isProd ? [] : [{ path: '/catalogue', element: lazyElement(<CataloguePage />) }]),
        {
          path: '/compagnie',
          element: (
            <ProtectedRoute requiredRole="compagnie">
              {lazyElement(<CompanyLayout />)}
            </ProtectedRoute>
          ),
          children: spaceChildren(<CompagnieDashboardPage />, [
            'voyages',
            'reservations',
            'vehicules',
            'personnel',
            'parametres',
          ]),
        },
        {
          path: '/business',
          element: (
            <ProtectedRoute requiredRole="business">
              {lazyElement(<BusinessLayout />)}
            </ProtectedRoute>
          ),
          children: spaceChildren(<BusinessDashboardPage />, [
            'locations',
            'vehicules',
            'demandes',
            'parametres',
          ]),
        },
        {
          path: '/admin',
          element: (
            <ProtectedRoute requiredRole="admin">
              {lazyElement(<AdminLayout />)}
            </ProtectedRoute>
          ),
          children: spaceChildren(<AdminDashboardPage />, [
            'utilisateurs',
            'compagnies',
            'business',
            'audit',
            'parametres',
          ]),
        },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ]
}
