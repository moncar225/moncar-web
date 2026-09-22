import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { createAppRoutes } from '../src/app/router/routes'
import type { SessionUser } from '../src/types/auth'

/** Rend l'application (mémoire) à un chemin donné, avec une session optionnelle. */
function renderAt(path: string, initialSession?: SessionUser | null) {
  const router = createMemoryRouter(createAppRoutes({ initialSession }), {
    initialEntries: [path],
  })
  render(<RouterProvider router={router} />)
}

const compagnieUser: SessionUser = {
  id: 'u-compagnie-1',
  fullName: 'Utilisateur Compagnie',
  roles: ['compagnie'],
}

const adminUser: SessionUser = {
  id: 'u-admin-1',
  fullName: 'Utilisateur Admin',
  roles: ['admin'],
}

describe('Application moncar-web', () => {
  it('démarre sur l\u2019accueil public avec le logo officiel et les trois espaces', async () => {
    renderAt('/')
    expect(
      await screen.findByRole('heading', { name: 'Plateforme de mobilité et transport' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /logo mon car/i })).toHaveAttribute(
      'src',
      '/brand/logo.png',
    )
    expect(screen.getByRole('link', { name: /espace compagnie/i })).toHaveAttribute(
      'href',
      '/compagnie',
    )
    expect(screen.getByRole('link', { name: /espace business/i })).toHaveAttribute(
      'href',
      '/business',
    )
    expect(screen.getByRole('link', { name: /administration/i })).toHaveAttribute(
      'href',
      '/admin',
    )
  })

  it('affiche la page 404 pour une route inconnue', async () => {
    renderAt('/cette-page-nexiste-pas')
    expect(
      await screen.findByRole('heading', { name: 'Page introuvable' }),
    ).toBeInTheDocument()
  })

  it('affiche la page 403 (accès interdit)', async () => {
    renderAt('/403')
    expect(
      await screen.findByRole('heading', { name: 'Accès interdit' }),
    ).toBeInTheDocument()
  })

  it('bloque un espace protégé lorsque l\u2019utilisateur n\u2019est pas authentifié', async () => {
    renderAt('/compagnie', null)
    expect(
      await screen.findByRole('heading', { name: 'Connexion requise' }),
    ).toBeInTheDocument()
  })

  it('charge l\u2019espace compagnie (lazy) avec son dashboard de démonstration', async () => {
    renderAt('/compagnie', compagnieUser)
    expect(await screen.findByRole('heading', { name: 'Compagnie' })).toBeInTheDocument()
    expect(await screen.findByText('Vue générale')).toBeInTheDocument()
    expect(screen.getAllByText(/données de démonstration/i).length).toBeGreaterThan(0)
  })

  it('affiche la page d\u2019attente d\u2019une rubrique sans logique métier', async () => {
    renderAt('/compagnie/voyages', compagnieUser)
    expect(
      await screen.findByRole('heading', { name: /interface « voyages » à venir/i }),
    ).toBeInTheDocument()
  })

  it('redirige vers /403 un utilisateur authentifié sans le rôle requis', async () => {
    renderAt('/admin', compagnieUser)
    expect(
      await screen.findByRole('heading', { name: 'Accès interdit' }),
    ).toBeInTheDocument()
  })

  it('charge l\u2019espace admin (lazy) pour un administrateur', async () => {
    renderAt('/admin', adminUser)
    expect(await screen.findByRole('heading', { name: 'Administration' })).toBeInTheDocument()
    expect(screen.getByText('Vue générale')).toBeInTheDocument()
  })
})
