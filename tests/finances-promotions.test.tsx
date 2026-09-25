import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { db } from '../src/mock-backend/db'
import { connecte, renderAt } from './helpers'

describe('Finances, promotions, paramètres, litiges', () => {
  it('le responsable financier consulte la synthèse et les reversements', async () => {
    const user = userEvent.setup()
    renderAt('/compagnie/finances', connecte('u-fin', 'finance'))
    expect(await screen.findByText('Solde dû par MON CAR')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Reversements' }))
    expect(await screen.findByRole('table', { name: 'États de reversement' })).toBeInTheDocument()
    expect(screen.getAllByText(/Payé le/).length).toBeGreaterThan(0)
  })

  it('les exports financiers sont désactivés, avec motif, pour un poste sans la permission', async () => {
    const user = userEvent.setup()
    renderAt('/compagnie/finances', connecte('u-dg', 'dg', { permissions: ['finances.consulter', 'tableau.consulter'] }))
    await user.click(await screen.findByRole('tab', { name: 'Écritures' }))
    const bouton = await screen.findByRole('button', { name: 'Exporter (CSV / Excel)' })
    expect(bouton).toBeDisabled()
    expect(bouton).toHaveAttribute('title', expect.stringMatching(/Exporter les états financiers/))
  })

  it('une promotion va du brouillon compagnie à la validation PROSOFT', async () => {
    const user = userEvent.setup()
    const vue = renderAt('/compagnie/commercial', connecte('u-com', 'commercial'))
    await user.click(await screen.findByRole('button', { name: 'Nouvelle promotion' }))
    await user.type(screen.getByLabelText('Titre'), 'Fête de l’indépendance −20 %')
    await user.clear(screen.getByLabelText('Réduction (%)'))
    await user.type(screen.getByLabelText('Réduction (%)'), '20')
    await user.click(screen.getByRole('button', { name: 'Enregistrer le brouillon' }))
    const ligne = (await screen.findByText('Fête de l’indépendance −20 %')).closest('tr') as HTMLElement
    await user.click(within(ligne).getByRole('button', { name: 'Soumettre' }))
    expect(await screen.findByText('Promotion soumise à PROSOFT.')).toBeInTheDocument()
    const promo = db().promotions.find((p) => p.titre === 'Fête de l’indépendance −20 %')
    expect(promo?.statut).toBe('soumise')
    vue.dispose()
  })

  it('PROSOFT refuse une promotion avec un motif', async () => {
    const user = userEvent.setup()
    renderAt('/admin/promotions', connecte('u-adm', 'admin_super'))
    const ligne = (await screen.findByText('Week-end SUV à -20 %')).closest('tr') as HTMLElement
    await user.click(within(ligne).getByRole('button', { name: 'Refuser' }))
    await user.click(screen.getByRole('button', { name: 'Confirmer le refus' }))
    expect(await screen.findByText('Le motif de refus est obligatoire.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Motif (transmis au partenaire)'), 'Conditions de la réduction à préciser')
    await user.click(screen.getByRole('button', { name: 'Confirmer le refus' }))
    await screen.findByText('Conditions de la réduction à préciser')
    expect(db().promotions.find((p) => p.id === 'p-3')?.statut).toBe('refusee')
  })

  it('refuse un taux de commission hors limites puis enregistre une valeur valide (journalisée)', async () => {
    const user = userEvent.setup()
    renderAt('/admin/parametres', connecte('u-adm', 'admin_super'))
    const champ = await screen.findByLabelText('Commission sur les billets (%)')
    await user.clear(champ)
    await user.type(champ, '45')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText(/doit être compris entre 0 et 30 %/)).toBeInTheDocument()
    await user.clear(champ)
    await user.type(champ, '6')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText('Paramètres enregistrés.')).toBeInTheDocument()
    expect(db().parametres.commissionVoyagePct).toBe(6)
    expect(db().audit[0]?.action).toBe('Modification des paramètres de la plateforme')
  })

  it('le support clôt un litige avec une décision obligatoire', async () => {
    const user = userEvent.setup()
    renderAt('/admin/litiges', connecte('u-ads', 'admin_support'))
    const ligne = (await screen.findByText('LIT-2026-0012')).closest('tr') as HTMLElement
    await user.click(within(ligne).getByRole('button', { name: 'Ouvrir' }))
    await user.type(screen.getByLabelText('Action / note d’instruction'), 'Photos du colis reçues')
    await user.selectOptions(screen.getByLabelText('Nouveau statut'), 'resolu')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText('La décision est obligatoire pour clore le dossier.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Décision (obligatoire pour clore)'), 'Indemnisation de 15 000 F par la compagnie')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText('Dossier mis à jour.')).toBeInTheDocument()
    expect(db().litiges.find((l) => l.id === 'lt-1')?.statut).toBe('resolu')
  })
})
