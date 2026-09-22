import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TechnoDemoForm } from '../src/components/demo/TechnoDemoForm'

describe('TechnoDemoForm (React Hook Form + Zod + TypeScript)', () => {
  it('affiche des messages d\u2019erreur en français à la soumission vide', async () => {
    const user = userEvent.setup()
    render(<TechnoDemoForm />)

    await user.click(screen.getByRole('button', { name: /envoyer la démonstration/i }))

    expect(await screen.findByText('L\u2019adresse e-mail est obligatoire.')).toBeInTheDocument()
    expect(
      screen.getByText('Le message doit contenir au moins 10 caractères.'),
    ).toBeInTheDocument()
  })

  it('rejette une adresse e-mail invalide avec un message clair', async () => {
    const user = userEvent.setup()
    render(<TechnoDemoForm />)

    await user.type(screen.getByLabelText('Adresse e-mail'), 'pas-une-adresse')
    await user.type(screen.getByLabelText('Message'), 'Un message suffisamment long.')
    await user.click(screen.getByRole('button', { name: /envoyer la démonstration/i }))

    expect(await screen.findByText('Adresse e-mail invalide.')).toBeInTheDocument()
  })

  it('valide le formulaire et affiche la confirmation (tout reste local)', async () => {
    const user = userEvent.setup()
    render(<TechnoDemoForm />)

    await user.type(screen.getByLabelText('Adresse e-mail'), 'test@moncar.ci')
    await user.type(screen.getByLabelText('Message'), 'Un message suffisamment long.')
    await user.click(screen.getByRole('button', { name: /envoyer la démonstration/i }))

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent('test@moncar.ci')
    expect(status).toHaveTextContent('démonstration technique réussie')
  })
})
