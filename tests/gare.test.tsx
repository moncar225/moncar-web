import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { db } from '../src/mock-backend/db'
import { connecte, renderAt } from './helpers'

type Utilisateur = ReturnType<typeof userEvent.setup>

async function ouvrirCaisseEtChoisirSiege(user: Utilisateur): Promise<string> {
  await user.click(await screen.findByRole('button', { name: 'Ouvrir la caisse' }))
  const voyages = await screen.findAllByRole('button', { pressed: false })
  const premier = voyages.find((b) => b.classList.contains('voyage-choix'))
  expect(premier).toBeDefined()
  await user.click(premier as HTMLElement)
  const cellules = await screen.findAllByRole('gridcell')
  const libre = cellules.find((c) => !(c as HTMLButtonElement).disabled && /^Siège \d+/.test(c.getAttribute('aria-label') ?? ''))
  expect(libre).toBeDefined()
  await user.click(libre as HTMLElement)
  const numero = /Siège (\d+)/.exec(libre?.getAttribute('aria-label') ?? '')?.[1] ?? ''
  await user.type(await screen.findByLabelText(`Siège ${numero} — nom du passager`), 'Awa Traoré')
  return numero
}

describe('Postes de gare — caisse, chef de gare, colis', () => {
  it('vend un billet au guichet puis clôture la caisse (écart à justifier)', async () => {
    const user = userEvent.setup()
    renderAt('/compagnie/caisse', connecte('u-cai', 'caisse'))
    const numero = await ouvrirCaisseEtChoisirSiege(user)
    await user.click(screen.getByRole('button', { name: 'Encaisser et imprimer' }))
    expect(await screen.findByText(/1 billet\(s\) émis/)).toBeInTheDocument()
    const vendu = db().reservations.find((r) => r.canal === 'guichet' && r.siege === numero && r.passager.nom === 'Awa Traoré')
    expect(vendu?.statut).toBe('payee')
    expect(db().ecritures.some((e) => e.reference === vendu?.billetNumero)).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Fermer' }))

    await user.click(screen.getByRole('button', { name: 'Clôturer la caisse' }))
    const dialogue = within(screen.getByRole('dialog'))
    await user.type(dialogue.getByLabelText('Espèces comptées'), '1000')
    await user.click(dialogue.getByRole('button', { name: 'Clôturer définitivement' }))
    expect(await screen.findByText(/un commentaire est obligatoire/)).toBeInTheDocument()
    await user.type(dialogue.getByLabelText(/Justification de l’écart/), 'Erreur de rendu de monnaie')
    await user.click(dialogue.getByRole('button', { name: 'Clôturer définitivement' }))
    expect(await screen.findByText('Caisse clôturée.')).toBeInTheDocument()
    expect(db().sessionsCaisse.some((s) => s.caissierId === 'u-cai' && s.statut === 'cloturee' && (s.ecart ?? 0) < 0 && s.commentaireEcart !== undefined)).toBe(true)
  })

  it('refuse un siège vendu entre-temps par un autre canal (409)', async () => {
    const user = userEvent.setup()
    renderAt('/compagnie/caisse', connecte('u-cai', 'caisse'))
    const numero = await ouvrirCaisseEtChoisirSiege(user)
    // Pendant la saisie, l'app client vend le même siège sur tout le trajet.
    const voyageSelectionne = db().voyages.find((v) =>
      db().reservations.every((r) => !(r.voyageId === v.id && r.siege === numero)) && (v.statut === 'programme' || v.statut === 'embarquement') && v.vehiculeId !== undefined,
    )
    for (const v of db().voyages) {
      db().reservations.push({
        id: `concurrent-${v.id}`,
        voyageId: v.id,
        siege: numero,
        montee: 0,
        descente: 9,
        passager: { nom: 'Client app', telephone: '0700000000' },
        statut: 'payee',
        canal: 'app',
        montant: 6000,
        billetNumero: `MC-TEST-${v.id}`,
        bagages: 0,
        creeLe: new Date().toISOString(),
      })
    }
    expect(voyageSelectionne).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Encaisser et imprimer' }))
    expect(await screen.findByText(new RegExp(`Siège\\(s\\) ${numero} vendu\\(s\\) entre-temps`))).toBeInTheDocument()
  })

  it('le chef de gare consulte le manifeste recalculé d’un voyage', async () => {
    const user = userEvent.setup()
    renderAt('/compagnie/gare', connecte('u-cg', 'chef_gare', { gare: { id: 'g-adj', nom: 'Gare d’Adjamé' } }))
    const boutons = await screen.findAllByRole('button', { name: 'Manifeste' })
    await user.click(boutons[0] as HTMLElement)
    expect(await screen.findByRole('button', { name: 'Imprimer le manifeste' })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Passagers du voyage' })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Mouvements par arrêt' })).toBeInTheDocument()
  })

  it('enregistre un colis avec tarif serveur puis fait avancer ses étapes', async () => {
    const user = userEvent.setup()
    renderAt('/compagnie/colis', connecte('u-col', 'colis', { gare: { id: 'g-adj', nom: 'Gare d’Adjamé' } }))
    await user.click(await screen.findByRole('button', { name: 'Enregistrer un colis' }))
    await user.type(screen.getByLabelText('Expéditeur — nom'), 'Yao Koffi')
    await user.type(screen.getByLabelText('Expéditeur — téléphone'), '0501020304')
    await user.type(screen.getByLabelText('Destinataire — nom'), 'Aya Koné')
    await user.type(screen.getByLabelText('Destinataire — téléphone'), '0102030405')
    await user.selectOptions(screen.getByLabelText('Gare d’arrivée'), 'g-yam')
    await user.type(screen.getByLabelText('Nature du colis'), 'Vêtements')
    await user.type(screen.getByLabelText('Poids (kg)'), '4')
    await user.click(screen.getByRole('button', { name: 'Calculer le tarif' }))
    expect(await screen.findByText(/Tarif \(calculé par le serveur\)/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Encaisser et enregistrer' }))
    await user.click(await screen.findByRole('button', { name: /Passer à « Contrôlé »/ }))
    expect(await screen.findByText('Étape enregistrée — le client est notifié.')).toBeInTheDocument()
    const cree = db().colis.find((c) => c.destinataire.nom === 'Aya Koné')
    expect(cree?.statut).toBe('controle')
    expect(cree?.historique.map((h) => h.etape)).toEqual(['enregistre', 'recu', 'controle'])
  })

  it('refuse la remise d’un colis sans preuve', async () => {
    const user = userEvent.setup()
    const colis = db().colis.find((c) => c.gareArriveeId === 'g-adj')
    expect(colis).toBeDefined()
    if (colis === undefined) return
    colis.statut = 'disponible'
    renderAt('/compagnie/colis', connecte('u-col', 'colis', { gare: { id: 'g-adj', nom: 'Gare d’Adjamé' } }))
    await user.click(await screen.findByRole('tab', { name: 'À l’arrivée' }))
    const ligne = (await screen.findByText(colis.numero)).closest('tr') as HTMLElement
    await user.click(within(ligne).getByRole('button', { name: 'Ouvrir' }))
    await user.click(await screen.findByRole('button', { name: 'Valider la remise' }))
    expect(await screen.findByText('La remise exige une preuve.')).toBeInTheDocument()
  })
})
