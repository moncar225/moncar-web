import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { db } from '../src/mock-backend/db'
import { connecte, renderAt } from './helpers'

const agence = () => connecte('u-bag', 'business_agence', { fournisseur: { id: 'f-agence', nom: 'Agence Location Abidjan (démo)', vtc: false } })
const vtc = () => connecte('u-vtc', 'business_proprietaire', { fournisseur: { id: 'f-vtc', nom: 'Kouassi VTC (démo)', vtc: true } })

describe('Espace BUSINESS — location et VTC', () => {
  it('refuse une demande sans motif puis avec motif transmis au client', async () => {
    const user = userEvent.setup()
    renderAt('/business/demandes', agence())
    const ligne = (await screen.findByText(/LOC-MC-\d{4}-000041/)).closest('tr') as HTMLElement
    await user.click(within(ligne).getByRole('button', { name: 'Refuser' }))
    await user.click(screen.getByRole('button', { name: 'Confirmer le refus' }))
    expect(await screen.findByText(/Le motif du refus est obligatoire/)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Motif (transmis au client)'), 'Véhicule en révision')
    await user.click(screen.getByRole('button', { name: 'Confirmer le refus' }))
    await screen.findByText('Véhicule en révision')
    expect(db().demandes.find((d) => d.id === 'dl-1')?.statut).toBe('refusee')
  })

  it('refuse d’accepter une demande sur une période où le véhicule est déjà loué', async () => {
    const user = userEvent.setup()
    // dl-1 (vl-1, J+3 → J+4) chevauche la location payée dl-3 (vl-1, J+2 → J+4).
    renderAt('/business/demandes', agence())
    const ligne = (await screen.findByText(/LOC-MC-\d{4}-000041/)).closest('tr') as HTMLElement
    await user.click(within(ligne).getByRole('button', { name: 'Accepter' }))
    expect(await screen.findByText(/n’est pas disponible sur cette période/)).toBeInTheDocument()
  })

  it('un propriétaire VTC ne peut pas proposer son VTC sans chauffeur (règle serveur)', async () => {
    const user = userEvent.setup()
    renderAt('/business/vehicules', vtc())
    await user.click(await screen.findByRole('button', { name: 'Ajouter un véhicule' }))
    await user.type(screen.getByLabelText('Titre de l’annonce'), 'Toyota Camry — VTC')
    await user.selectOptions(screen.getByLabelText('Mode de prestation'), 'vtc')
    expect(screen.getByLabelText(/Sans chauffeur/)).toBeDisabled()
    await user.type(screen.getByLabelText('Tarif journée (F)'), '45000')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText('Véhicule ajouté en brouillon.')).toBeInTheDocument()
    const cree = db().vehiculesLocation.find((v) => v.titre === 'Toyota Camry — VTC')
    expect(cree?.mode).toBe('vtc')
    expect(cree?.sansChauffeur).toBe(false)
    expect(cree?.avecChauffeur).toBe(true)
  })

  it('une agence sans autorisation VTC ne peut pas choisir le mode VTC', async () => {
    const user = userEvent.setup()
    renderAt('/business/vehicules', agence())
    await user.click(await screen.findByRole('button', { name: 'Ajouter un véhicule' }))
    const option = within(screen.getByLabelText('Mode de prestation')).getByRole('option', { name: /VTC/ }) as HTMLOptionElement
    expect(option.disabled).toBe(true)
  })

  it('bloque une période de maintenance', async () => {
    const user = userEvent.setup()
    renderAt('/business/disponibilites', agence())
    await screen.findByRole('option', { name: 'Hyundai Tucson' })
    await user.selectOptions(screen.getByLabelText('Véhicule'), 'vl-3')
    await user.click(screen.getByRole('button', { name: 'Bloquer' }))
    expect(await screen.findByText('Période bloquée.')).toBeInTheDocument()
    expect(db().indisponibilites.some((i) => i.vehiculeId === 'vl-3' && i.motif === 'maintenance')).toBe(true)
  })
})
