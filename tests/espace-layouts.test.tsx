import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { connecte, renderAt } from './helpers'

function menu() {
  return within(screen.getAllByRole('navigation', { name: /^navigation/i })[0] as HTMLElement)
}

describe('Menus des espaces filtrés par permissions', () => {
  it('le directeur général voit toutes les rubriques compagnie', async () => {
    renderAt('/compagnie', connecte('u-dg', 'dg'))
    await screen.findByRole('navigation', { name: /navigation espace compagnie/i })
    for (const label of ['Tableau de bord', 'Caisse', 'Gare du jour', 'Planning des voyages', 'Finances', 'Personnel et gares']) {
      expect(menu().getByRole('link', { name: label })).toBeInTheDocument()
    }
  })

  it('la caisse ne voit que ses rubriques et arrive directement sur la caisse', async () => {
    const router = renderAt('/compagnie', connecte('u-cai', 'caisse'))
    await screen.findByRole('navigation', { name: /navigation espace compagnie/i })
    expect(menu().getByRole('link', { name: 'Caisse' })).toBeInTheDocument()
    expect(menu().queryByRole('link', { name: 'Finances' })).not.toBeInTheDocument()
    expect(menu().queryByRole('link', { name: 'Tableau de bord' })).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/compagnie/caisse')
  })

  it('une rubrique non autorisée ouverte par URL directe renvoie la page 403 avec le motif', async () => {
    renderAt('/compagnie/finances', connecte('u-cai', 'caisse'))
    expect(await screen.findByRole('heading', { name: 'Accès interdit' })).toBeInTheDocument()
    expect(screen.getByText(/Consulter les finances/)).toBeInTheDocument()
  })

  it('l’espace business affiche le fournisseur de la session', async () => {
    renderAt('/business', connecte('u-bag', 'business_agence'))
    await screen.findByRole('navigation', { name: /navigation espace business/i })
    expect(menu().getByRole('link', { name: 'Demandes' })).toBeInTheDocument()
    expect(screen.getAllByText(/Agence Location Abidjan/).length).toBeGreaterThan(0)
  })

  it('un poste PROSOFT spécialisé ne voit que sa rubrique', async () => {
    renderAt('/admin', connecte('u-ads', 'admin_support'))
    await screen.findByRole('navigation', { name: /navigation administration/i })
    expect(menu().getByRole('link', { name: 'Support et litiges' })).toBeInTheDocument()
    expect(menu().queryByRole('link', { name: 'Paramètres plateforme' })).not.toBeInTheDocument()
  })

  it('le super administrateur voit les 7 rubriques PROSOFT', async () => {
    renderAt('/admin', connecte('u-adm', 'admin_super'))
    await screen.findByRole('navigation', { name: /navigation administration/i })
    for (const label of [
      'Validation des partenaires',
      'Comptes et rôles',
      'Référentiels',
      'Paramètres plateforme',
      'Promotions',
      'Support et litiges',
      'Journal d’audit',
    ]) {
      expect(menu().getByRole('link', { name: label })).toBeInTheDocument()
    }
  })
})
