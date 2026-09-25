import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { createAppRoutes } from '../src/app/router/routes'
import type { SessionUser } from '../src/types/auth'
import { connecte } from './helpers'

/** Rend l'application (mémoire) à un chemin donné, avec une session optionnelle. */
function renderAt(path: string, initialSession?: SessionUser | null) {
  const router = createMemoryRouter(createAppRoutes({ initialSession }), {
    initialEntries: [path],
  })
  render(<RouterProvider router={router} />)
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
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
  })

  it('charge l\u2019espace compagnie (lazy) avec son dashboard de démonstration', async () => {
    renderAt('/compagnie', connecte('u-dg', 'dg'))
    expect(await screen.findByRole('heading', { name: 'Compagnie' })).toBeInTheDocument()
    expect(await screen.findByText('Vue générale')).toBeInTheDocument()
    expect(await screen.findByText('Billets vendus aujourd’hui')).toBeInTheDocument()
  })

  it('ouvre les rubriques de l’espace business (revenus)', async () => {
    renderAt('/business/revenus', connecte('u-bag', 'business_agence'))
    expect(await screen.findByRole('heading', { name: 'Revenus' })).toBeInTheDocument()
    expect(await screen.findByText(/En séquestre/)).toBeInTheDocument()
  })

  it('redirige vers /403 un utilisateur authentifié sans le rôle requis', async () => {
    renderAt('/admin', connecte('u-dg', 'dg'))
    expect(
      await screen.findByRole('heading', { name: 'Accès interdit' }),
    ).toBeInTheDocument()
  })

  it('charge l\u2019espace admin (lazy) pour un administrateur', async () => {
    renderAt('/admin', connecte('u-adm', 'admin_super'))
    expect(await screen.findByRole('heading', { name: 'Administration' })).toBeInTheDocument()
    expect(await screen.findByText('Vue générale')).toBeInTheDocument()
    expect(await screen.findByText('Commissions PROSOFT')).toBeInTheDocument()
  })
})
