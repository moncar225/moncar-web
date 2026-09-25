import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { db } from '../src/mock-backend/db'
import { connecte, renderAt } from './helpers'

describe('Sprint 3 — référentiels, validation, comptes', () => {
  it('PROSOFT refuse une compagnie : le motif est obligatoire puis la décision est journalisée', async () => {
    const user = userEvent.setup()
    renderAt('/admin/validation', connecte('u-adm', 'admin_super'))
    const ligne = (await screen.findByText('Baie Voyages (démo)')).closest('tr') as HTMLElement
    await user.click(within(ligne).getByRole('button', { name: 'Examiner' }))
    await user.selectOptions(screen.getByLabelText('Décision'), 'refusee')
    await user.click(screen.getByRole('button', { name: 'Enregistrer la décision' }))
    expect(await screen.findByText(/motif est obligatoire/i)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Motif (obligatoire)'), 'Pièces du dirigeant manquantes')
    await user.click(screen.getByRole('button', { name: 'Enregistrer la décision' }))
    expect(await screen.findByText('Décision enregistrée.')).toBeInTheDocument()
    expect(db().compagnies.find((c) => c.id === 'c-baie')?.statut).toBe('refusee')
    expect(db().audit[0]?.action).toMatch(/refusee/)
  })

  it('la compagnie crée un agent : mot de passe temporaire affiché une fois', async () => {
    const user = userEvent.setup()
    renderAt('/compagnie/personnel', connecte('u-rh', 'rh_gares'))
    await screen.findByText('Fatou Ouattara')
    await user.click(screen.getByRole('button', { name: 'Créer un compte' }))
    await user.type(screen.getByLabelText('Prénom'), 'Grâce')
    await user.type(screen.getByLabelText('Nom'), 'Yéo')
    await user.type(screen.getByLabelText('Téléphone'), '0799887766')
    await user.selectOptions(screen.getByLabelText('Poste'), 'caisse')
    await user.selectOptions(screen.getByLabelText('Gare de rattachement'), 'g-yop')
    await user.click(screen.getByRole('button', { name: 'Créer le compte' }))
    expect(await screen.findByText(/Mot de passe temporaire de Grâce Yéo/)).toBeInTheDocument()
    const cree = db().comptes.find((c) => c.telephone === '0799887766')
    expect(cree?.motDePasseTemporaire).toBe(true)
    expect(cree?.compagnieId).toBe('c-lagune')
  })

  it('un numéro déjà utilisé est refusé avec un message clair', async () => {
    const user = userEvent.setup()
    renderAt('/compagnie/personnel', connecte('u-rh', 'rh_gares'))
    await screen.findByText('Fatou Ouattara')
    await user.click(screen.getByRole('button', { name: 'Créer un compte' }))
    await user.type(screen.getByLabelText('Prénom'), 'Test')
    await user.type(screen.getByLabelText('Nom'), 'Doublon')
    await user.type(screen.getByLabelText('Téléphone'), '0700000017')
    await user.selectOptions(screen.getByLabelText('Poste'), 'chauffeur')
    await user.click(screen.getByRole('button', { name: 'Créer le compte' }))
    expect(await screen.findByText('Un compte existe déjà avec ce numéro.')).toBeInTheDocument()
  })

  it('la compagnie ne voit que son personnel (isolation)', async () => {
    renderAt('/compagnie/personnel', connecte('u-rh', 'rh_gares'))
    await screen.findByText('Fatou Ouattara')
    expect(screen.queryByText('Brahima Touré')).not.toBeInTheDocument()
    expect(screen.queryByText('Nadia Kacou')).not.toBeInTheDocument()
  })

  it('ajoute une gare avec sa position', async () => {
    const user = userEvent.setup()
    renderAt('/compagnie/personnel', connecte('u-rh', 'rh_gares'))
    await user.click(await screen.findByRole('tab', { name: 'Gares' }))
    await user.click(await screen.findByRole('button', { name: 'Ajouter une gare' }))
    await user.type(screen.getByLabelText('Nom de la gare'), 'Gare de Toumodi')
    await user.selectOptions(screen.getByLabelText('Ville'), 'v-tou')
    await user.type(screen.getByLabelText('Adresse'), 'Carrefour principal')
    await user.type(screen.getByLabelText('Latitude'), '6.5572')
    await user.type(screen.getByLabelText('Longitude'), '-5.0193')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText('Gare ajoutée.')).toBeInTheDocument()
    expect(db().gares.some((g) => g.nom === 'Gare de Toumodi' && g.compagnieId === 'c-lagune')).toBe(true)
  })
})
