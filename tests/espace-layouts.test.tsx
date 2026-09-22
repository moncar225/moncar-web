import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '../src/app/providers/AppProviders'
import CompanyLayout from '../src/app/layouts/CompanyLayout'
import BusinessLayout from '../src/app/layouts/BusinessLayout'
import AdminLayout from '../src/app/layouts/AdminLayout'
import type { SessionUser } from '../src/types/auth'

const anyRoleUser: SessionUser = {
  id: 'u-test',
  fullName: 'Test Utilisateur',
  roles: ['compagnie', 'business', 'admin'],
}

/** Monte un layout espace avec des pages filles factices. */
function renderLayout(layout: React.ReactElement) {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <AppProviders initialSession={anyRoleUser}>{layout}</AppProviders>,
      children: [{ index: true, element: <p>Contenu de la page</p> }],
    },
  ])
  render(<RouterProvider router={router} />)
}

describe('CompanyLayout', () => {
  it('affiche la sidebar avec les rubriques UI de l\u2019espace compagnie', async () => {
    renderLayout(<CompanyLayout />)
    for (const label of ['Tableau de bord', 'Voyages', 'Réservations', 'Véhicules', 'Personnel', 'Paramètres']) {
      expect(await screen.findByRole('link', { name: label })).toBeInTheDocument()
    }
    expect(screen.getByText('Contenu de la page')).toBeInTheDocument()
  })
})

describe('BusinessLayout', () => {
  it('affiche les rubriques et le sélecteur d\u2019entité (mock)', async () => {
    renderLayout(<BusinessLayout />)
    expect(await screen.findByRole('link', { name: 'Locations' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /agence location abidjan/i })).toBeInTheDocument()
  })

  it('permet de changer d\u2019entité via le sélecteur', async () => {
    const user = userEvent.setup()
    renderLayout(<BusinessLayout />)
    await user.click(await screen.findByRole('button', { name: /agence location abidjan/i }))
    await user.click(screen.getByRole('menuitem', { name: /kouassi vtc/i }))
    expect(screen.getByRole('button', { name: /kouassi vtc/i })).toBeInTheDocument()
  })
})

describe('AdminLayout', () => {
  it('affiche les rubriques d\u2019administration', async () => {
    renderLayout(<AdminLayout />)
    for (const label of ['Dashboard', 'Utilisateurs', 'Compagnies', 'Business', 'Audit', 'Paramètres']) {
      expect(await screen.findByRole('link', { name: label })).toBeInTheDocument()
    }
  })
})
