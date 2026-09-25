import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { sessionManager } from '../src/api/client'
import { renderAt } from './helpers'

afterEach(() => {
  sessionManager.clear()
})

async function seConnecter(identifiant: string, motDePasse: string) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Téléphone ou e-mail'), identifiant)
  await user.type(screen.getByLabelText('Mot de passe'), motDePasse)
  await user.click(screen.getByRole('button', { name: 'Se connecter' }))
  return user
}

describe('Connexion des postes web (faux backend)', () => {
  it('refuse un mauvais mot de passe avec un message clair', async () => {
    renderAt('/connexion')
    await seConnecter('caisse@lagune.demo', 'mauvais')
    expect(await screen.findByText('Identifiant ou mot de passe incorrect.')).toBeInTheDocument()
  })

  it('connecte la caisse et ouvre directement sa rubrique', async () => {
    const router = renderAt('/connexion')
    await seConnecter('caisse@lagune.demo', 'Moncar2026')
    await screen.findByRole('navigation', { name: /navigation espace compagnie/i })
    expect(router.state.location.pathname).toBe('/compagnie/caisse')
    expect(screen.getByText(/Caisse · Gare d’Adjamé/)).toBeInTheDocument()
  })

  it('exige la double authentification pour le directeur général', async () => {
    const router = renderAt('/connexion')
    const user = await seConnecter('dg@lagune.demo', 'Moncar2026')
    const champ = await screen.findByLabelText(/Code reçu par SMS/)
    await user.type(champ, '000000')
    await user.click(screen.getByRole('button', { name: 'Valider le code' }))
    expect(await screen.findByText('Code incorrect.')).toBeInTheDocument()
    await user.clear(champ)
    await user.type(champ, '123456')
    await user.click(screen.getByRole('button', { name: 'Valider le code' }))
    await screen.findByRole('navigation', { name: /navigation espace compagnie/i })
    expect(router.state.location.pathname).toBe('/compagnie')
  })

  it('impose le changement du mot de passe temporaire', async () => {
    const router = renderAt('/connexion')
    const user = await seConnecter('nouveau@lagune.demo', 'Temp1234')
    expect(await screen.findByRole('heading', { name: 'Choisissez votre mot de passe' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Nouveau mot de passe'), 'Abidjan2027')
    await user.type(screen.getByLabelText('Confirmation'), 'Abidjan2027')
    await user.click(screen.getByRole('button', { name: 'Enregistrer et continuer' }))
    await screen.findByRole('navigation', { name: /navigation espace compagnie/i })
    expect(router.state.location.pathname).toBe('/compagnie/caisse')
  })

  it('refuse un poste terrain sur le web', async () => {
    renderAt('/connexion')
    await seConnecter('chauffeur1@lagune.demo', 'Moncar2026')
    expect(await screen.findByText(/s’utilise dans l’application MON CAR PRO/)).toBeInTheDocument()
  })
})
