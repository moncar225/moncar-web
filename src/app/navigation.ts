import type { ShellNavItem } from './layouts/AppShell'

/**
 * Menus des trois espaces (roadmap §11). Chaque entrée porte sa permission :
 * un poste ne voit que ses rubriques (8 postes compagnie, 7 postes PROSOFT).
 */
export const NAV_COMPAGNIE: ShellNavItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', to: '/compagnie', permission: 'tableau.consulter' },
  { id: 'caisse', label: 'Caisse', to: '/compagnie/caisse', permission: 'caisse.vendre' },
  { id: 'gare', label: 'Gare du jour', to: '/compagnie/gare', permission: 'gare.exploiter' },
  { id: 'colis', label: 'Colis', to: '/compagnie/colis', permission: 'colis.gerer' },
  { id: 'planning', label: 'Planning des voyages', to: '/compagnie/planning', permission: 'planning.consulter' },
  { id: 'lignes', label: 'Lignes et arrêts', to: '/compagnie/lignes', permission: 'lignes.gerer' },
  { id: 'vehicules', label: 'Flotte', to: '/compagnie/vehicules', permission: 'flotte.gerer' },
  { id: 'finances', label: 'Finances', to: '/compagnie/finances', permission: 'finances.consulter' },
  { id: 'commercial', label: 'Commercial', to: '/compagnie/commercial', permission: 'commercial.gerer' },
  { id: 'personnel', label: 'Personnel et gares', to: '/compagnie/personnel', permission: 'personnel.gerer' },
  { id: 'audit', label: 'Journal d’audit', to: '/compagnie/audit', permission: 'audit.consulter' },
  { id: 'parametres', label: 'Paramètres', to: '/compagnie/parametres', permission: 'compagnie.parametrer' },
]

export const NAV_ADMIN: ShellNavItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', to: '/admin' },
  { id: 'validation', label: 'Validation des partenaires', to: '/admin/validation', permission: 'admin.compagnies.valider' },
  { id: 'comptes', label: 'Comptes et rôles', to: '/admin/comptes', permission: 'admin.comptes.gerer' },
  { id: 'referentiels', label: 'Référentiels', to: '/admin/referentiels', permission: 'admin.referentiels.gerer' },
  { id: 'parametres', label: 'Paramètres plateforme', to: '/admin/parametres', permission: 'admin.parametres.gerer' },
  { id: 'promotions', label: 'Promotions', to: '/admin/promotions', permission: 'admin.promotions.valider' },
  { id: 'litiges', label: 'Support et litiges', to: '/admin/litiges', permission: 'admin.litiges.traiter' },
  { id: 'audit', label: 'Journal d’audit', to: '/admin/audit', permission: 'audit.consulter' },
]

export const NAV_BUSINESS: ShellNavItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', to: '/business' },
  { id: 'vehicules', label: 'Véhicules', to: '/business/vehicules', permission: 'business.vehicules.gerer' },
  { id: 'disponibilites', label: 'Disponibilités', to: '/business/disponibilites', permission: 'business.vehicules.gerer' },
  { id: 'demandes', label: 'Demandes', to: '/business/demandes', permission: 'business.demandes.traiter' },
  { id: 'revenus', label: 'Revenus', to: '/business/revenus', permission: 'business.revenus.consulter' },
  { id: 'promotions', label: 'Promotions', to: '/business/promotions', permission: 'business.vehicules.gerer' },
  { id: 'litiges', label: 'Litiges', to: '/business/litiges', permission: 'business.demandes.traiter' },
]
