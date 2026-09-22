import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { Button, Card, Badge, Avatar, Breadcrumb } from '../src/components/ui'

describe('Button', () => {
  it('déclenche onClick et rend son libellé', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={onClick}>Réserver</Button>)

    await user.click(screen.getByRole('button', { name: 'Réserver' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('état loading : désactivé, aria-busy, spinner affiché', () => {
    render(
      <Button isLoading onClick={() => {}}>
        Enregistrer
      </Button>,
    )
    const button = screen.getByRole('button', { name: /enregistrer/i })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button.querySelector('.mc-spinner')).not.toBeNull()
  })

  it('applique la variante orange aux actions principales', () => {
    render(
      <Button variant="primary" onClick={() => {}}>
        Action
      </Button>,
    )
    expect(screen.getByRole('button', { name: 'Action' }).className).toContain('mc-btn--primary')
  })
})

describe('Card', () => {
  it('affiche titre et contenu', () => {
    render(<Card title="Voyages">Contenu carte</Card>)
    expect(screen.getByRole('heading', { name: 'Voyages' })).toBeInTheDocument()
    expect(screen.getByText('Contenu carte')).toBeInTheDocument()
  })
})

describe('Badge', () => {
  it('affiche son contenu avec la variante demandée', () => {
    render(<Badge variant="accent">Nouveau</Badge>)
    expect(screen.getByText('Nouveau').className).toContain('mc-badge--accent')
  })
})

describe('Avatar', () => {
  it('utilise les initiales quand aucune photo', () => {
    render(<Avatar name="Marcel Koffi" />)
    expect(screen.getByRole('img', { name: /avatar de marcel koffi/i })).toHaveTextContent('MK')
  })
})

describe('Breadcrumb', () => {
  it('marque le dernier élément comme page courante', () => {
    render(
      <MemoryRouter>
        <Breadcrumb
          items={[{ label: 'Accueil', to: '/' }, { label: 'Compagnie' }]}
        />
      </MemoryRouter>,
    )
    const nav = screen.getByRole('navigation', { name: /fil d'ariane/i })
    expect(nav).toHaveTextContent('Accueil')
    expect(nav.querySelector('[aria-current="page"]')).toHaveTextContent('Compagnie')
  })
})
