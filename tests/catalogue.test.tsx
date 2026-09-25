import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { createAppRoutes } from '../src/app/router/routes'

function renderAt(path: string) {
  const router = createMemoryRouter(createAppRoutes(), { initialEntries: [path] })
  render(<RouterProvider router={router} />)
}

describe('Catalogue de composants (hors production)', () => {
  it('affiche les sections du design system et les messages d’erreur API', async () => {
    renderAt('/catalogue')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Catalogue de composants' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Boutons' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'États vide et erreur' })).toBeInTheDocument()
    expect(screen.getByText(/Cette ressource n’est plus disponible/)).toBeInTheDocument()
  })

  it('est accessible depuis l’accueil en développement', async () => {
    renderAt('/')
    expect(
      await screen.findByRole('link', { name: 'Catalogue de composants' }),
    ).toHaveAttribute('href', '/catalogue')
  })
})
