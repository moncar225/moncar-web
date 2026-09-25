import type { Espace, Poste } from './types'

/**
 * Référentiel des permissions (AUTH-003). En production, les permissions
 * d'un compte sont renvoyées par le serveur (`GET /me/capacites`) — l'interface
 * ne fait que masquer / désactiver ; le serveur vérifie à chaque appel.
 * Cette table sert au faux backend (MSW) et documente l'intention.
 */
export const PERMISSIONS = {
  // Compagnie
  'tableau.consulter': 'Consulter le tableau de bord',
  'lignes.gerer': 'Gérer les lignes et arrêts',
  'flotte.gerer': 'Gérer les véhicules et plans de sièges',
  'planning.gerer': 'Programmer et affecter les voyages',
  'planning.consulter': 'Consulter le planning',
  'caisse.vendre': 'Vendre au guichet',
  'caisse.cloturer': 'Clôturer une caisse',
  'manifeste.consulter': 'Consulter et imprimer les manifestes',
  'gare.exploiter': 'Exploiter la gare (départs, arrivées, gare suivante)',
  'finances.consulter': 'Consulter les finances',
  'finances.exporter': 'Exporter les états financiers',
  'personnel.gerer': 'Gérer le personnel et les gares',
  'commercial.gerer': 'Gérer les offres et promotions',
  'colis.gerer': 'Gérer les colis de la gare',
  'compagnie.parametrer': 'Modifier les paramètres de la compagnie',
  // Administration PROSOFT
  'admin.compagnies.valider': 'Valider les compagnies et fournisseurs',
  'admin.comptes.gerer': 'Gérer les comptes et rôles plateforme',
  'admin.referentiels.gerer': 'Gérer les référentiels (villes, catégories)',
  'admin.parametres.gerer': 'Modifier les paramètres de la plateforme',
  'admin.promotions.valider': 'Valider les promotions',
  'admin.litiges.traiter': 'Traiter le support et les litiges',
  'audit.consulter': 'Consulter le journal d’audit',
  // Business
  'business.vehicules.gerer': 'Publier et gérer les véhicules',
  'business.demandes.traiter': 'Traiter les demandes de location',
  'business.revenus.consulter': 'Consulter les revenus',
} as const

export type Permission = keyof typeof PERMISSIONS

const TOUTES_COMPAGNIE: Permission[] = [
  'tableau.consulter',
  'lignes.gerer',
  'flotte.gerer',
  'planning.gerer',
  'planning.consulter',
  'caisse.vendre',
  'caisse.cloturer',
  'manifeste.consulter',
  'gare.exploiter',
  'finances.consulter',
  'finances.exporter',
  'personnel.gerer',
  'commercial.gerer',
  'colis.gerer',
  'compagnie.parametrer',
  'audit.consulter',
]

const TOUTES_ADMIN: Permission[] = [
  'admin.compagnies.valider',
  'admin.comptes.gerer',
  'admin.referentiels.gerer',
  'admin.parametres.gerer',
  'admin.promotions.valider',
  'admin.litiges.traiter',
  'audit.consulter',
]

export const POSTES: Record<Poste, { libelle: string; espace: Espace | 'terrain'; permissions: Permission[] }> = {
  // 8 postes web compagnie (CDC, roadmap §11.1)
  dg: { libelle: 'Directeur général', espace: 'compagnie', permissions: TOUTES_COMPAGNIE },
  finance: {
    libelle: 'Responsable financier',
    espace: 'compagnie',
    permissions: ['tableau.consulter', 'finances.consulter', 'finances.exporter', 'planning.consulter', 'audit.consulter'],
  },
  rh_gares: {
    libelle: 'Gestion des gares / RH',
    espace: 'compagnie',
    permissions: ['tableau.consulter', 'personnel.gerer', 'planning.consulter'],
  },
  flotte: {
    libelle: 'Gestionnaire de flotte',
    espace: 'compagnie',
    permissions: ['tableau.consulter', 'flotte.gerer', 'lignes.gerer', 'planning.gerer', 'planning.consulter'],
  },
  commercial: {
    libelle: 'Service commercial',
    espace: 'compagnie',
    permissions: ['tableau.consulter', 'commercial.gerer', 'planning.consulter'],
  },
  chef_gare: {
    libelle: 'Chef de gare',
    espace: 'compagnie',
    permissions: ['tableau.consulter', 'gare.exploiter', 'manifeste.consulter', 'planning.consulter', 'caisse.cloturer'],
  },
  caisse: { libelle: 'Caisse', espace: 'compagnie', permissions: ['caisse.vendre', 'planning.consulter'] },
  colis: { libelle: 'Service colis', espace: 'compagnie', permissions: ['colis.gerer'] },
  // Postes terrain (app PRO, pas d'accès web)
  controleur: { libelle: 'Contrôleur', espace: 'terrain', permissions: [] },
  convoyeur: { libelle: 'Convoyeur', espace: 'terrain', permissions: [] },
  chauffeur: { libelle: 'Chauffeur', espace: 'terrain', permissions: [] },
  // 7 postes Super Admin PROSOFT (roadmap §11.3) + super administrateur
  admin_super: { libelle: 'Super administrateur', espace: 'admin', permissions: TOUTES_ADMIN },
  admin_validation: {
    libelle: 'Validation des partenaires',
    espace: 'admin',
    permissions: ['admin.compagnies.valider'],
  },
  admin_comptes: { libelle: 'Comptes et rôles', espace: 'admin', permissions: ['admin.comptes.gerer'] },
  admin_referentiels: {
    libelle: 'Référentiels',
    espace: 'admin',
    permissions: ['admin.referentiels.gerer'],
  },
  admin_parametres: {
    libelle: 'Paramètres plateforme',
    espace: 'admin',
    permissions: ['admin.parametres.gerer'],
  },
  admin_promotions: {
    libelle: 'Validation des promotions',
    espace: 'admin',
    permissions: ['admin.promotions.valider'],
  },
  admin_support: { libelle: 'Support et litiges', espace: 'admin', permissions: ['admin.litiges.traiter'] },
  admin_audit: { libelle: 'Journal d’audit', espace: 'admin', permissions: ['audit.consulter'] },
  // Espace BUSINESS
  business_agence: {
    libelle: 'Agence de location',
    espace: 'business',
    permissions: ['business.vehicules.gerer', 'business.demandes.traiter', 'business.revenus.consulter'],
  },
  business_proprietaire: {
    libelle: 'Propriétaire / chauffeur VTC',
    espace: 'business',
    permissions: ['business.vehicules.gerer', 'business.demandes.traiter', 'business.revenus.consulter'],
  },
}

/** Postes sensibles pour lesquels la double authentification est exigée (CDC). */
export function exigeA2f(poste: Poste): boolean {
  return poste === 'dg' || poste === 'finance' || POSTES[poste].espace === 'admin'
}
