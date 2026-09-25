/**
 * Modèle métier MON CAR côté web — reprend les entités de la roadmap (§8,
 * tables PostgreSQL). Ces types seront remplacés par ceux générés depuis le
 * contrat OpenAPI (Richard) ; les noms de champs suivent la roadmap pour
 * limiter les écarts au moment de la bascule.
 */

export type Id = string
/** Date-heure ISO 8601 (UTC). */
export type IsoDateTime = string
/** Date ISO (AAAA-MM-JJ). */
export type IsoDate = string

// ——— Référentiels (§8.2) ———

export interface Ville {
  id: Id
  nom: string
  region: string
}

export type StatutValidation = 'en_attente' | 'validee' | 'suspendue' | 'refusee'

export interface Compagnie {
  id: Id
  nom: string
  sigle: string
  telephone: string
  email: string
  adresse: string
  villeSiegeId: Id
  statut: StatutValidation
  motifDecision?: string
  /** Paramètres financiers — valeurs ⚠ A-4, modifiables sans code. */
  commissionPct: number
  fraisOperation: number
  accepteColis: boolean
  creeLe: IsoDateTime
}

export interface Gare {
  id: Id
  compagnieId: Id
  nom: string
  villeId: Id
  adresse: string
  lat: number
  lng: number
  horaires: string
  active: boolean
}

export interface CategorieVehicule {
  id: Id
  nom: string
  usage: 'transport' | 'location'
}

// ——— Comptes, postes, permissions (§8.1, AUTH-003) ———

export type Espace = 'compagnie' | 'business' | 'admin'

export type PosteCompagnie =
  | 'dg'
  | 'finance'
  | 'rh_gares'
  | 'flotte'
  | 'commercial'
  | 'chef_gare'
  | 'caisse'
  | 'colis'
export type PosteTerrain = 'controleur' | 'convoyeur' | 'chauffeur'
export type PosteAdmin =
  | 'admin_super'
  | 'admin_validation'
  | 'admin_comptes'
  | 'admin_referentiels'
  | 'admin_parametres'
  | 'admin_promotions'
  | 'admin_support'
  | 'admin_audit'
export type PosteBusiness = 'business_agence' | 'business_proprietaire'
export type Poste = PosteCompagnie | PosteTerrain | PosteAdmin | PosteBusiness

export interface Compte {
  id: Id
  prenom: string
  nom: string
  telephone: string
  email: string
  espace: Espace
  poste: Poste
  compagnieId?: Id
  gareId?: Id
  fournisseurId?: Id
  statut: 'actif' | 'suspendu'
  motDePasseTemporaire: boolean
  /** Double authentification exigée (rôles financiers et administration). */
  a2f: boolean
  derniereConnexion?: IsoDateTime
  creeLe: IsoDateTime
}

// ——— Lignes, arrêts, segments (REF-002) ———

export interface Arret {
  id: Id
  /** Ordre sur la ligne (0 = origine). */
  ordre: number
  nom: string
  villeId: Id
  gareId?: Id
  lat: number
  lng: number
  /** Temps de parcours de référence depuis l'origine. */
  minutesDepuisOrigine: number
  kmDepuisOrigine: number
}

export interface Ligne {
  id: Id
  compagnieId: Id
  code: string
  nom: string
  arrets: Arret[]
  active: boolean
}

// ——— Flotte et plans de sièges (FLT-001) ———

export type TypeCellule = 'siege' | 'couloir' | 'chauffeur' | 'porte' | 'vide'
export type ClasseSiege = 'standard' | 'vip'

export interface CelluleSiege {
  rang: number
  col: number
  type: TypeCellule
  numero?: string
  classe?: ClasseSiege
}

export interface PlanSieges {
  rangees: number
  colonnes: number
  cellules: CelluleSiege[]
}

export type EtatVehicule = 'disponible' | 'en_service' | 'maintenance' | 'hors_service'
export type Standing = 'Standard' | 'VIP' | 'Premium'

export interface Vehicule {
  id: Id
  compagnieId: Id
  immatriculation: string
  marque: string
  modele: string
  categorieId: Id
  standing: Standing
  services: string[]
  plan: PlanSieges
  etat: EtatVehicule
  kilometrage: number
  prochaineMaintenance?: IsoDate
}

// ——— Voyages et planning (VOY-001) ———

export type StatutVoyage = 'programme' | 'embarquement' | 'en_route' | 'arrive' | 'annule'

export interface Voyage {
  id: Id
  compagnieId: Id
  ligneId: Id
  reference: string
  depart: IsoDateTime
  vehiculeId?: Id
  chauffeurId?: Id
  convoyeurId?: Id
  statut: StatutVoyage
  retardMinutes: number
  /** Prix du trajet complet (origine → terminus), F CFA. */
  prixPlein: number
  /** Ordre du dernier arrêt franchi (suivi GPS), -1 avant le départ. */
  dernierArretFranchi: number
}

// ——— Réservations, billets, embarquement (RES-001, QR-001/002) ———

export type StatutReservation = 'bloquee' | 'payee' | 'embarquee' | 'descendue' | 'annulee'
export type Canal = 'app' | 'guichet'
export type MoyenPaiement = 'especes' | 'orange_money' | 'mtn_momo' | 'moov_money' | 'wave' | 'carte'

export interface Passager {
  nom: string
  telephone: string
  piece?: string
}

export interface Reservation {
  id: Id
  voyageId: Id
  siege: string
  /** Ordre de l'arrêt de montée / de descente (segment [montee, descente[). */
  montee: number
  descente: number
  passager: Passager
  statut: StatutReservation
  canal: Canal
  montant: number
  moyen?: MoyenPaiement
  billetNumero: string
  sessionCaisseId?: Id
  bagages: number
  creeLe: IsoDateTime
  embarqueLe?: IsoDateTime
}

// ——— Caisse (CAI-001) ———

export interface SessionCaisse {
  id: Id
  gareId: Id
  caissierId: Id
  ouverture: IsoDateTime
  fondInitial: number
  statut: 'ouverte' | 'cloturee'
  cloture?: IsoDateTime
  /** Montant compté par le caissier à la clôture. */
  montantDeclare?: number
  /** Écart déclaré − attendu (signalé, jamais masqué). */
  ecart?: number
  commentaireEcart?: string
}

// ——— Argent (PAY-002) ———

export type Journal = 'vente' | 'commission' | 'reversement' | 'caisse' | 'remboursement' | 'location'

export interface Ecriture {
  id: Id
  date: IsoDateTime
  journal: Journal
  libelle: string
  compteDebit: string
  compteCredit: string
  montant: number
  reference: string
  compagnieId?: Id
}

export interface Reversement {
  id: Id
  compagnieId: Id
  periode: string
  montantBrut: number
  commission: number
  montantNet: number
  echeance: IsoDate
  statut: 'a_payer' | 'paye'
  payeLe?: IsoDateTime
}

export interface Rapprochement {
  id: Id
  date: IsoDate
  referencePrestataire: string
  moyen: MoyenPaiement
  montantPrestataire: number
  montantMonCar: number
  statut: 'ok' | 'ecart'
}

// ——— Colis (COL-001/002) ———

export type EtapeColis =
  | 'enregistre'
  | 'recu'
  | 'controle'
  | 'charge'
  | 'en_transit'
  | 'arrive'
  | 'disponible'
  | 'remis'

export interface EvenementColis {
  etape: EtapeColis
  date: IsoDateTime
  auteur: string
  lieu: string
}

export interface Colis {
  id: Id
  numero: string
  compagnieId: Id
  gareDepartId: Id
  gareArriveeId: Id
  voyageId?: Id
  expediteur: { nom: string; telephone: string }
  destinataire: { nom: string; telephone: string }
  nature: string
  poidsKg: number
  valeurDeclaree: number
  montant: number
  statut: EtapeColis
  historique: EvenementColis[]
  preuveRemise?: { recuPar: string; piece: string; date: IsoDateTime }
}

// ——— Location BUSINESS + VTC (LOC-001→006) ———

export interface Fournisseur {
  id: Id
  nom: string
  type: 'agence' | 'compagnie' | 'proprietaire'
  statut: StatutValidation
  telephone: string
  villeId: Id
  /** Propriétaire déclaré chauffeur VTC (autorisation VTC fournie). */
  vtc: boolean
  creeLe: IsoDateTime
}

export type CategorieLocation = 'berline' | 'suv' | '4x4' | 'minibus' | 'bus' | 'car'

export interface VehiculeLocation {
  id: Id
  fournisseurId: Id
  titre: string
  categorie: CategorieLocation
  places: number
  /** VTC ⇒ avec chauffeur obligatoire (règle serveur, CDC §32). */
  mode: 'standard' | 'vtc'
  avecChauffeur: boolean
  sansChauffeur: boolean
  villeId: Id
  tarifJour: number
  tarifDemiJour: number
  supplementExterieurJour: number
  statut: 'publie' | 'brouillon' | 'suspendu'
}

export interface Indisponibilite {
  id: Id
  vehiculeId: Id
  debut: IsoDate
  fin: IsoDate
  motif: 'location' | 'maintenance' | 'indisponible'
}

export type StatutDemande = 'recue' | 'acceptee' | 'refusee' | 'payee' | 'en_cours' | 'terminee'

export interface DemandeLocation {
  id: Id
  numero: string
  vehiculeId: Id
  fournisseurId: Id
  client: { nom: string; telephone: string }
  debut: IsoDate
  fin: IsoDate
  zone: 'interieur' | 'exterieur'
  destination?: string
  motif: string
  personnes: number
  avecChauffeur: boolean
  montant: number
  statut: StatutDemande
  motifRefus?: string
  creeLe: IsoDateTime
}

// ——— Promotions, fidélité (PRO-001, FID-001) ———

export type StatutPromotion = 'brouillon' | 'soumise' | 'validee' | 'refusee'

export interface Promotion {
  id: Id
  titre: string
  description: string
  auteurType: 'compagnie' | 'fournisseur'
  auteurId: Id
  auteurNom: string
  cible: 'voyage' | 'colis' | 'location'
  reductionPct: number
  debut: IsoDate
  fin: IsoDate
  statut: StatutPromotion
  motifRefus?: string
}

/** Règles paramétrables d'un programme (valeurs ⚠ A-9, non tranchées). */
export interface ProgrammeFidelite {
  id: Id
  nom: string
  porteurType: 'moncar' | 'compagnie' | 'fournisseur'
  porteurId?: Id
  pointsPour1000F: number
  valeurPointF: number
  validiteMois: number
  actif: boolean
  membres: number
  pointsEmis: number
  pointsUtilises: number
}

// ——— Litiges, audit, plateforme ———

export interface Litige {
  id: Id
  numero: string
  type: 'colis' | 'location' | 'voyage' | 'paiement'
  objet: string
  plaignant: string
  misEnCause: string
  compagnieId?: Id
  fournisseurId?: Id
  statut: 'ouvert' | 'en_cours' | 'resolu' | 'rejete'
  creeLe: IsoDateTime
  historique: { date: IsoDateTime; auteur: string; action: string }[]
  decision?: string
}

export interface EntreeAudit {
  id: Id
  date: IsoDateTime
  auteur: string
  poste: Poste
  action: string
  entite: string
  entiteId: Id
  avant?: unknown
  apres?: unknown
  compagnieId?: Id
}

export interface ParametresPlateforme {
  commissionVoyagePct: number
  fraisOperationVoyage: number
  fraisOperationColis: number
  commissionLocationPct: number
  /** Blocage d'un siège pendant le paiement (⚠ T-9). */
  dureeBlocageSiegeMin: number
  periodiciteReversement: 'hebdomadaire' | 'bimensuelle' | 'mensuelle'
}
