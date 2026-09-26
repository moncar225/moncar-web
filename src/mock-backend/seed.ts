/**
 * ⚠️ FAUX BACKEND — jeu de démonstration (compagnies fictives « (démo) »).
 * Sert uniquement tant que l'API MON CAR (Richard) n'est pas publiée.
 * Les dates sont calculées par rapport au jour courant pour que les écrans
 * « du jour » restent vivants.
 */
import type {
  Arret,
  CategorieVehicule,
  CelluleSiege,
  Colis,
  Compagnie,
  Compte,
  DemandeLocation,
  Ecriture,
  EntreeAudit,
  EtapeColis,
  Fournisseur,
  Gare,
  Indisponibilite,
  Ligne,
  Litige,
  MoyenPaiement,
  ParametresPlateforme,
  PlanSieges,
  ProgrammeFidelite,
  Promotion,
  Rapprochement,
  Reservation,
  Reversement,
  SessionCaisse,
  Vehicule,
  VehiculeLocation,
  Ville,
  Voyage,
} from '@/domain/types'
import { jourDe } from '@/lib/format'

export interface MockDb {
  version: number
  /** Jour (AAAA-MM-JJ) de génération : le jeu est régénéré chaque jour. */
  generatedOn: string
  villes: Ville[]
  compagnies: Compagnie[]
  gares: Gare[]
  categories: CategorieVehicule[]
  comptes: Compte[]
  /** Mots de passe du faux backend (jamais côté vrai client). */
  motsDePasse: Record<string, string>
  lignes: Ligne[]
  vehicules: Vehicule[]
  voyages: Voyage[]
  reservations: Reservation[]
  sessionsCaisse: SessionCaisse[]
  ecritures: Ecriture[]
  reversements: Reversement[]
  rapprochements: Rapprochement[]
  colis: Colis[]
  fournisseurs: Fournisseur[]
  vehiculesLocation: VehiculeLocation[]
  indisponibilites: Indisponibilite[]
  demandes: DemandeLocation[]
  promotions: Promotion[]
  programmes: ProgrammeFidelite[]
  litiges: Litige[]
  audit: EntreeAudit[]
  parametres: ParametresPlateforme
  sequences: Record<string, number>
}

export const MOCK_DB_VERSION = 2
export const MOT_DE_PASSE_DEMO = 'Moncar2026'

// ——— Utilitaires déterministes ———

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function jourIso(offset: number, heure = 0, minute = 0): string {
  const d = new Date()
  d.setHours(heure, minute, 0, 0)
  d.setDate(d.getDate() + offset)
  return d.toISOString()
}

/** Horodatage d’une vente : jamais dans le futur quand elle a lieu aujourd’hui. */
function venduLe(rnd: () => number, offset: number): string {
  if (offset < 0) return jourIso(offset, 7 + Math.floor(rnd() * 13), Math.floor(rnd() * 60))
  const maintenant = new Date()
  const minutes = Math.floor(rnd() * Math.max(1, maintenant.getHours() * 60 + maintenant.getMinutes()))
  return jourIso(0, Math.floor(minutes / 60), minutes % 60)
}

function dateIso(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return jourDe(d)
}

// ——— Plans de sièges ———

/** Plan 2 + 2 avec couloir central ; `rangeesVip` premières rangées en VIP. */
export function genererPlan(rangees: number, rangeesVip = 0): PlanSieges {
  const colonnes = 5
  const cellules: CelluleSiege[] = []
  let numero = 1
  for (let rang = 0; rang < rangees; rang++) {
    for (let col = 0; col < colonnes; col++) {
      if (rang === 0 && col === 0) {
        cellules.push({ rang, col, type: 'chauffeur' })
        continue
      }
      if (rang === 0 && col === 4) {
        cellules.push({ rang, col, type: 'porte' })
        continue
      }
      if (rang === 0) {
        cellules.push({ rang, col, type: 'vide' })
        continue
      }
      if (col === 2 && rang < rangees - 1) {
        cellules.push({ rang, col, type: 'couloir' })
        continue
      }
      cellules.push({
        rang,
        col,
        type: 'siege',
        numero: String(numero++),
        classe: rang <= rangeesVip ? 'vip' : 'standard',
      })
    }
  }
  return { rangees, colonnes, cellules }
}

export function numerosSieges(plan: PlanSieges): string[] {
  return plan.cellules.filter((c) => c.type === 'siege' && c.numero !== undefined).map((c) => c.numero as string)
}

// ——— Construction ———

export function construireDb(): MockDb {
  const rnd = mulberry32(20260925)
  const pick = <T,>(items: readonly T[]): T => items[Math.floor(rnd() * items.length)] as T
  const now = new Date().toISOString()

  const villes: Ville[] = [
    { id: 'v-abj', nom: 'Abidjan', region: 'Abidjan' },
    { id: 'v-any', nom: 'Anyama', region: 'Abidjan' },
    { id: 'v-ndo', nom: 'N’Douci', region: 'Agnéby-Tiassa' },
    { id: 'v-tou', nom: 'Toumodi', region: 'Bélier' },
    { id: 'v-yam', nom: 'Yamoussoukro', region: 'Yamoussoukro' },
    { id: 'v-tie', nom: 'Tiébissou', region: 'Bélier' },
    { id: 'v-bke', nom: 'Bouaké', region: 'Gbêkê' },
    { id: 'v-dal', nom: 'Daloa', region: 'Haut-Sassandra' },
    { id: 'v-sp', nom: 'San-Pédro', region: 'San-Pédro' },
    { id: 'v-kor', nom: 'Korhogo', region: 'Poro' },
  ]

  const compagnies: Compagnie[] = [
    {
      id: 'c-lagune',
      nom: 'Lagune Express (démo)',
      sigle: 'LEX',
      telephone: '+225 27 20 00 00 01',
      email: 'contact@lagune-express.demo',
      adresse: 'Gare routière d’Adjamé, Abidjan',
      villeSiegeId: 'v-abj',
      statut: 'validee',
      commissionPct: 5,
      fraisOperation: 200,
      accepteColis: true,
      creeLe: jourIso(-120),
    },
    {
      id: 'c-savane',
      nom: 'Savane Transport (démo)',
      sigle: 'SVT',
      telephone: '+225 27 20 00 00 02',
      email: 'contact@savane-transport.demo',
      adresse: 'Boulevard Nangui Abrogoua, Adjamé',
      villeSiegeId: 'v-abj',
      statut: 'validee',
      commissionPct: 5,
      fraisOperation: 200,
      accepteColis: true,
      creeLe: jourIso(-90),
    },
    {
      id: 'c-baie',
      nom: 'Baie Voyages (démo)',
      sigle: 'BVO',
      telephone: '+225 27 34 00 00 03',
      email: 'contact@baie-voyages.demo',
      adresse: 'Quartier Bardot, San-Pédro',
      villeSiegeId: 'v-sp',
      statut: 'en_attente',
      commissionPct: 5,
      fraisOperation: 200,
      accepteColis: false,
      creeLe: jourIso(-2),
    },
  ]

  const gares: Gare[] = [
    { id: 'g-adj', compagnieId: 'c-lagune', nom: 'Gare d’Adjamé', villeId: 'v-abj', adresse: 'Adjamé Liberté', lat: 5.3563, lng: -4.0239, horaires: '05:00 – 21:00', active: true },
    { id: 'g-yop', compagnieId: 'c-lagune', nom: 'Gare de Yopougon', villeId: 'v-abj', adresse: 'Yopougon Siporex', lat: 5.3445, lng: -4.0781, horaires: '05:30 – 20:00', active: true },
    { id: 'g-yam', compagnieId: 'c-lagune', nom: 'Gare de Yamoussoukro', villeId: 'v-yam', adresse: 'Quartier Habitat', lat: 6.8205, lng: -5.2767, horaires: '05:00 – 21:00', active: true },
    { id: 'g-bke', compagnieId: 'c-lagune', nom: 'Gare de Bouaké', villeId: 'v-bke', adresse: 'Quartier Commerce', lat: 7.6899, lng: -5.0303, horaires: '05:00 – 20:30', active: true },
    { id: 'g-sadj', compagnieId: 'c-savane', nom: 'Gare Savane Adjamé', villeId: 'v-abj', adresse: 'Adjamé 220 Logements', lat: 5.3601, lng: -4.0212, horaires: '05:00 – 21:00', active: true },
    { id: 'g-dal', compagnieId: 'c-savane', nom: 'Gare de Daloa', villeId: 'v-dal', adresse: 'Quartier Lobia', lat: 6.8774, lng: -6.4502, horaires: '05:30 – 20:00', active: true },
  ]

  const categories: CategorieVehicule[] = [
    { id: 'cat-car', nom: 'Car grand confort', usage: 'transport' },
    { id: 'cat-autocar', nom: 'Autocar', usage: 'transport' },
    { id: 'cat-minibus', nom: 'Minibus', usage: 'transport' },
    { id: 'cat-berline', nom: 'Berline', usage: 'location' },
    { id: 'cat-suv', nom: 'SUV / 4x4', usage: 'location' },
  ]

  const compte = (
    id: string,
    prenom: string,
    nom: string,
    telephone: string,
    email: string,
    poste: Compte['poste'],
    espace: Compte['espace'],
    extra: Partial<Compte> = {},
  ): Compte => ({
    id,
    prenom,
    nom,
    telephone,
    email,
    poste,
    espace,
    statut: 'actif',
    motDePasseTemporaire: false,
    a2f: poste === 'dg' || poste === 'finance' || espace === 'admin',
    creeLe: jourIso(-60),
    ...extra,
  })

  const comptes: Compte[] = [
    compte('u-dg', 'Awa', 'Koné', '0700000011', 'dg@lagune.demo', 'dg', 'compagnie', { compagnieId: 'c-lagune' }),
    compte('u-fin', 'Yao', 'Kouadio', '0700000012', 'finance@lagune.demo', 'finance', 'compagnie', { compagnieId: 'c-lagune' }),
    compte('u-rh', 'Mariam', 'Traoré', '0700000013', 'rh@lagune.demo', 'rh_gares', 'compagnie', { compagnieId: 'c-lagune' }),
    compte('u-flo', 'Serge', 'N’Guessan', '0700000014', 'flotte@lagune.demo', 'flotte', 'compagnie', { compagnieId: 'c-lagune' }),
    compte('u-com', 'Aïcha', 'Bamba', '0700000015', 'commercial@lagune.demo', 'commercial', 'compagnie', { compagnieId: 'c-lagune' }),
    compte('u-cg', 'Ibrahim', 'Diabaté', '0700000016', 'chefgare@lagune.demo', 'chef_gare', 'compagnie', { compagnieId: 'c-lagune', gareId: 'g-adj' }),
    compte('u-cai', 'Fatou', 'Ouattara', '0700000017', 'caisse@lagune.demo', 'caisse', 'compagnie', { compagnieId: 'c-lagune', gareId: 'g-adj' }),
    compte('u-col', 'Koffi', 'Assi', '0700000018', 'colis@lagune.demo', 'colis', 'compagnie', { compagnieId: 'c-lagune', gareId: 'g-adj' }),
    compte('u-ch1', 'Moussa', 'Coulibaly', '0700000021', 'chauffeur1@lagune.demo', 'chauffeur', 'compagnie', { compagnieId: 'c-lagune' }),
    compte('u-ch2', 'Jean', 'Konan', '0700000022', 'chauffeur2@lagune.demo', 'chauffeur', 'compagnie', { compagnieId: 'c-lagune' }),
    compte('u-ch3', 'Adama', 'Sanogo', '0700000023', 'chauffeur3@lagune.demo', 'chauffeur', 'compagnie', { compagnieId: 'c-lagune' }),
    compte('u-cv1', 'Paul', 'Yapi', '0700000031', 'convoyeur1@lagune.demo', 'convoyeur', 'compagnie', { compagnieId: 'c-lagune' }),
    compte('u-cv2', 'Rachel', 'Aka', '0700000032', 'convoyeur2@lagune.demo', 'convoyeur', 'compagnie', { compagnieId: 'c-lagune' }),
    compte('u-ct1', 'Didier', 'Gnagne', '0700000041', 'controleur1@lagune.demo', 'controleur', 'compagnie', { compagnieId: 'c-lagune', gareId: 'g-adj' }),
    compte('u-sdg', 'Brahima', 'Touré', '0700000051', 'dg@savane.demo', 'dg', 'compagnie', { compagnieId: 'c-savane' }),
    compte('u-adm', 'Nadia', 'Kacou', '0700000001', 'admin@prosoft.demo', 'admin_super', 'admin'),
    compte('u-adv', 'Eric', 'Brou', '0700000002', 'validation@prosoft.demo', 'admin_validation', 'admin'),
    compte('u-ads', 'Carine', 'Loba', '0700000003', 'support@prosoft.demo', 'admin_support', 'admin'),
    compte('u-bag', 'Olivier', 'Ehui', '0700000061', 'agence@business.demo', 'business_agence', 'business', { fournisseurId: 'f-agence' }),
    compte('u-vtc', 'Kouassi', 'Amani', '0700000062', 'vtc@business.demo', 'business_proprietaire', 'business', { fournisseurId: 'f-vtc' }),
    compte('u-tmp', 'Estelle', 'Djè', '0700000019', 'nouveau@lagune.demo', 'caisse', 'compagnie', {
      compagnieId: 'c-lagune',
      gareId: 'g-yop',
      motDePasseTemporaire: true,
    }),
  ]
  const motsDePasse: Record<string, string> = {}
  for (const c of comptes) motsDePasse[c.id] = c.motDePasseTemporaire ? 'Temp1234' : MOT_DE_PASSE_DEMO

  const arret = (
    id: string,
    ordre: number,
    nom: string,
    villeId: string,
    lat: number,
    lng: number,
    minutes: number,
    km: number,
    gareId?: string,
  ): Arret => ({ id, ordre, nom, villeId, lat, lng, minutesDepuisOrigine: minutes, kmDepuisOrigine: km, gareId })

  const lignes: Ligne[] = [
    {
      id: 'l-abj-yam',
      compagnieId: 'c-lagune',
      code: 'LEX-01',
      nom: 'Abidjan → Yamoussoukro',
      active: true,
      arrets: [
        arret('a1', 0, 'Gare d’Adjamé', 'v-abj', 5.3563, -4.0239, 0, 0, 'g-adj'),
        arret('a2', 1, 'Anyama', 'v-any', 5.4946, -4.0518, 35, 18),
        arret('a3', 2, 'N’Douci', 'v-ndo', 5.8667, -4.7667, 95, 104),
        arret('a4', 3, 'Toumodi', 'v-tou', 6.5572, -5.0193, 165, 190),
        arret('a5', 4, 'Gare de Yamoussoukro', 'v-yam', 6.8205, -5.2767, 210, 240, 'g-yam'),
      ],
    },
    {
      id: 'l-abj-bke',
      compagnieId: 'c-lagune',
      code: 'LEX-02',
      nom: 'Abidjan → Bouaké',
      active: true,
      arrets: [
        arret('b1', 0, 'Gare d’Adjamé', 'v-abj', 5.3563, -4.0239, 0, 0, 'g-adj'),
        arret('b2', 1, 'Toumodi', 'v-tou', 6.5572, -5.0193, 160, 190),
        arret('b3', 2, 'Gare de Yamoussoukro', 'v-yam', 6.8205, -5.2767, 205, 240, 'g-yam'),
        arret('b4', 3, 'Tiébissou', 'v-tie', 7.1575, -5.2247, 245, 285),
        arret('b5', 4, 'Gare de Bouaké', 'v-bke', 7.6899, -5.0303, 300, 345, 'g-bke'),
      ],
    },
    {
      id: 'l-abj-dal',
      compagnieId: 'c-savane',
      code: 'SVT-01',
      nom: 'Abidjan → Daloa',
      active: true,
      arrets: [
        arret('d1', 0, 'Gare Savane Adjamé', 'v-abj', 5.3601, -4.0212, 0, 0, 'g-sadj'),
        arret('d2', 1, 'Gare de Yamoussoukro', 'v-yam', 6.8205, -5.2767, 220, 240),
        arret('d3', 2, 'Gare de Daloa', 'v-dal', 6.8774, -6.4502, 330, 380, 'g-dal'),
      ],
    },
  ]

  const vehicules: Vehicule[] = [
    { id: 've-1', compagnieId: 'c-lagune', immatriculation: '1234 HJ 01', marque: 'Yutong', modele: 'ZK6122', categorieId: 'cat-car', standing: 'VIP', services: ['Climatisation', 'Wi-Fi', 'Prises USB'], plan: genererPlan(12, 2), etat: 'disponible', kilometrage: 184000, prochaineMaintenance: dateIso(20) },
    { id: 've-2', compagnieId: 'c-lagune', immatriculation: '5678 HK 01', marque: 'Higer', modele: 'KLQ6129', categorieId: 'cat-car', standing: 'Standard', services: ['Climatisation'], plan: genererPlan(14), etat: 'disponible', kilometrage: 256000, prochaineMaintenance: dateIso(4) },
    { id: 've-3', compagnieId: 'c-lagune', immatriculation: '9012 HL 01', marque: 'Mercedes', modele: 'Tourismo', categorieId: 'cat-autocar', standing: 'Premium', services: ['Climatisation', 'Wi-Fi', 'Toilettes', 'Collation'], plan: genererPlan(11, 11), etat: 'disponible', kilometrage: 98000, prochaineMaintenance: dateIso(35) },
    { id: 've-4', compagnieId: 'c-lagune', immatriculation: '3456 HM 01', marque: 'Yutong', modele: 'ZK6107', categorieId: 'cat-car', standing: 'Standard', services: ['Climatisation'], plan: genererPlan(13), etat: 'maintenance', kilometrage: 312000, prochaineMaintenance: dateIso(1) },
    { id: 've-5', compagnieId: 'c-savane', immatriculation: '7788 JA 01', marque: 'King Long', modele: 'XMQ6127', categorieId: 'cat-car', standing: 'Standard', services: ['Climatisation'], plan: genererPlan(13), etat: 'disponible', kilometrage: 201000 },
  ]

  // ——— Voyages sur 8 jours (J-1 → J+6) ———
  const horaires: Array<{ ligneId: string; h: number; m: number; prix: number }> = [
    { ligneId: 'l-abj-yam', h: 6, m: 0, prix: 6000 },
    { ligneId: 'l-abj-yam', h: 9, m: 0, prix: 6000 },
    { ligneId: 'l-abj-yam', h: 13, m: 0, prix: 6000 },
    { ligneId: 'l-abj-yam', h: 16, m: 30, prix: 6000 },
    { ligneId: 'l-abj-bke', h: 7, m: 30, prix: 8000 },
    { ligneId: 'l-abj-bke', h: 14, m: 0, prix: 8000 },
    { ligneId: 'l-abj-dal', h: 8, m: 0, prix: 9000 },
  ]
  const vehiculesLagune = ['ve-1', 've-2', 've-3']
  const chauffeurs = ['u-ch1', 'u-ch2', 'u-ch3']
  const convoyeurs = ['u-cv1', 'u-cv2']
  const voyages: Voyage[] = []
  const nowMs = Date.now()
  let seqVoyage = 1
  for (let jour = -1; jour <= 6; jour++) {
    horaires.forEach((h, idx) => {
      const ligne = lignes.find((l) => l.id === h.ligneId)
      if (ligne === undefined) return
      const depart = jourIso(jour, h.h, h.m)
      const departMs = new Date(depart).getTime()
      const dureeMin = ligne.arrets[ligne.arrets.length - 1]?.minutesDepuisOrigine ?? 0
      const ecouleMin = (nowMs - departMs) / 60000
      let statut: Voyage['statut'] = 'programme'
      let dernier = -1
      if (ecouleMin > dureeMin) {
        statut = 'arrive'
        dernier = ligne.arrets.length - 1
      } else if (ecouleMin >= 0) {
        statut = 'en_route'
        dernier = ligne.arrets.filter((a) => a.minutesDepuisOrigine <= ecouleMin).length - 1
      } else if (ecouleMin > -45) {
        statut = 'embarquement'
      }
      const lagune = ligne.compagnieId === 'c-lagune'
      const affecte = jour <= 2
      voyages.push({
        id: `vo-${seqVoyage}`,
        compagnieId: ligne.compagnieId,
        ligneId: ligne.id,
        reference: `${ligne.code}-${jourDe(depart).slice(5).replace('-', '')}-${String(h.h).padStart(2, '0')}${String(h.m).padStart(2, '0')}`,
        depart,
        vehiculeId: lagune && affecte ? vehiculesLagune[idx % vehiculesLagune.length] : lagune ? undefined : 've-5',
        chauffeurId: lagune && affecte ? chauffeurs[idx % chauffeurs.length] : undefined,
        convoyeurId: lagune && affecte ? convoyeurs[idx % convoyeurs.length] : undefined,
        statut,
        retardMinutes: statut === 'en_route' && idx === 1 ? 15 : 0,
        prixPlein: h.prix,
        dernierArretFranchi: dernier,
      })
      seqVoyage++
    })
  }

  // ——— Réservations ———
  const prenoms = ['Aya', 'Kouamé', 'Adjoua', 'Yao', 'Affoué', 'Koffi', 'Amenan', 'Drissa', 'Salimata', 'Ahou', 'Seydou', 'Akissi', 'Lassina', 'Nadège', 'Hervé']
  const noms = ['Kouassi', 'Koné', 'Yao', 'Traoré', 'N’Dri', 'Bamba', 'Ouattara', 'Kouadio', 'Diallo', 'Gbagbo', 'Assi', 'Fofana', 'Kacou', 'Tanoh']
  const moyens: MoyenPaiement[] = ['orange_money', 'mtn_momo', 'wave', 'moov_money', 'carte']
  const reservations: Reservation[] = []
  let seqBillet = 1
  for (const v of voyages) {
    const ligne = lignes.find((l) => l.id === v.ligneId)
    const vehicule = vehicules.find((x) => x.id === (v.vehiculeId ?? 've-2'))
    if (ligne === undefined || vehicule === undefined) continue
    const sieges = numerosSieges(vehicule.plan)
    const jour = Math.round((new Date(v.depart).getTime() - nowMs) / 86400000)
    const taux = jour <= 0 ? 0.75 : Math.max(0.15, 0.6 - jour * 0.08)
    const dernierOrdre = ligne.arrets.length - 1
    for (const siege of sieges) {
      if (rnd() > taux) continue
      const partiel = rnd() < 0.25
      const montee = partiel && rnd() < 0.3 ? 1 : 0
      const descente = partiel ? Math.min(dernierOrdre, montee + 1 + Math.floor(rnd() * (dernierOrdre - montee))) : dernierOrdre
      const kmTotal = ligne.arrets[dernierOrdre]?.kmDepuisOrigine ?? 1
      const km = (ligne.arrets[descente]?.kmDepuisOrigine ?? kmTotal) - (ligne.arrets[montee]?.kmDepuisOrigine ?? 0)
      const montant = Math.max(1000, Math.round((v.prixPlein * km) / kmTotal / 100) * 100)
      const guichet = rnd() < 0.35
      let statut: Reservation['statut'] = 'payee'
      if (v.statut === 'arrive') statut = 'descendue'
      else if (v.statut === 'en_route') statut = v.dernierArretFranchi >= descente ? 'descendue' : 'embarquee'
      else if (v.statut === 'embarquement' && rnd() < 0.5) statut = 'embarquee'
      reservations.push({
        id: `r-${seqBillet}`,
        voyageId: v.id,
        siege,
        montee,
        descente,
        passager: {
          nom: `${pick(prenoms)} ${pick(noms)}`,
          telephone: `07${String(Math.floor(rnd() * 1e8)).padStart(8, '0')}`,
        },
        statut,
        canal: guichet ? 'guichet' : 'app',
        montant,
        moyen: guichet ? 'especes' : pick(moyens),
        billetNumero: `MC-${new Date().getFullYear()}-${String(seqBillet).padStart(6, '0')}`,
        bagages: Math.floor(rnd() * 3),
        // Ventes réparties sur les jours précédant le départ (graphiques réalistes) ;
        // les voyages à venir se vendent aussi aujourd’hui, avant l’heure courante.
        creeLe: venduLe(rnd, jour > 0 ? -Math.floor(rnd() * 10) : Math.min(jour, 0) - 1 - Math.floor(rnd() * 10)),
        embarqueLe: statut === 'embarquee' || statut === 'descendue' ? v.depart : undefined,
      })
      seqBillet++
    }
  }

  // ——— Caisse, écritures, reversements, rapprochements ———
  const sessionsCaisse: SessionCaisse[] = [
    {
      id: 'sc-1',
      gareId: 'g-adj',
      caissierId: 'u-cai',
      ouverture: jourIso(-1, 5, 0),
      fondInitial: 50000,
      statut: 'cloturee',
      cloture: jourIso(-1, 21, 0),
      montantDeclare: 498000,
      ecart: -2000,
      commentaireEcart: 'Billet de 2 000 F manquant, signalé au chef de gare.',
    },
  ]

  const ecritures: Ecriture[] = []
  let seqEcr = 1
  for (const r of reservations) {
    if (r.statut === 'annulee' || r.statut === 'bloquee') continue
    const v = voyages.find((x) => x.id === r.voyageId)
    if (v === undefined) continue
    const comp = compagnies.find((c) => c.id === v.compagnieId)
    const commission = Math.round((r.montant * (comp?.commissionPct ?? 5)) / 100)
    ecritures.push({
      id: `e-${seqEcr++}`,
      date: r.creeLe,
      journal: r.canal === 'guichet' ? 'caisse' : 'vente',
      libelle: `Vente billet ${r.billetNumero}`,
      compteDebit: r.canal === 'guichet' ? '531 Caisse gare' : '512 Encaissements CinetPay',
      compteCredit: '467 Dette compagnie',
      montant: r.montant,
      reference: r.billetNumero,
      compagnieId: v.compagnieId,
    })
    if (r.canal === 'app') {
      ecritures.push({
        id: `e-${seqEcr++}`,
        date: r.creeLe,
        journal: 'commission',
        libelle: `Commission PROSOFT ${r.billetNumero}`,
        compteDebit: '467 Dette compagnie',
        compteCredit: '706 Commissions PROSOFT',
        montant: commission,
        reference: r.billetNumero,
        compagnieId: v.compagnieId,
      })
    }
  }

  const reversements: Reversement[] = []
  for (const c of ['c-lagune', 'c-savane']) {
    for (let s = 4; s >= 1; s--) {
      const brut = Math.round((1800000 + rnd() * 900000) / 100) * 100
      const commission = Math.round(brut * 0.05)
      reversements.push({
        id: `rv-${c}-${s}`,
        compagnieId: c,
        periode: `Semaine du ${dateIso(-7 * s - 6)} au ${dateIso(-7 * s)}`,
        montantBrut: brut,
        commission,
        montantNet: brut - commission,
        echeance: dateIso(-7 * s + 3),
        statut: s === 1 ? 'a_payer' : 'paye',
        payeLe: s === 1 ? undefined : jourIso(-7 * s + 3, 11),
      })
    }
  }

  const rapprochements: Rapprochement[] = []
  for (let j = 7; j >= 1; j--) {
    const montant = Math.round((350000 + rnd() * 200000) / 100) * 100
    const ecart = j === 3
    rapprochements.push({
      id: `rp-${j}`,
      date: dateIso(-j),
      referencePrestataire: `CP-${dateIso(-j).replaceAll('-', '')}-${pick(['OM', 'MTN', 'WAVE'])}`,
      moyen: pick(moyens),
      montantPrestataire: montant,
      montantMonCar: ecart ? montant - 6000 : montant,
      statut: ecart ? 'ecart' : 'ok',
    })
  }

  // ——— Colis ———
  const etapes: EtapeColis[] = ['enregistre', 'recu', 'controle', 'charge', 'en_transit', 'arrive', 'disponible', 'remis']
  const natures = ['Documents', 'Vêtements', 'Pièces détachées', 'Vivres', 'Téléphone', 'Médicaments']
  const colis: Colis[] = []
  for (let i = 1; i <= 14; i++) {
    const idx = Math.floor(rnd() * etapes.length)
    const statut = etapes[idx] ?? 'enregistre'
    const versAbidjan = i % 4 === 0
    const historique = etapes.slice(0, idx + 1).map((etape, k) => ({
      etape,
      date: jourIso(-2, 8 + k * 2),
      auteur: k < 3 ? 'Koffi Assi (service colis)' : k < 5 ? 'Paul Yapi (convoyeur)' : 'Gare de Yamoussoukro',
      lieu: k < 4 ? 'Gare d’Adjamé' : k < 5 ? 'En route' : 'Gare de Yamoussoukro',
    }))
    const poids = Math.round((1 + rnd() * 24) * 10) / 10
    colis.push({
      id: `co-${i}`,
      numero: `COL-MC-${new Date().getFullYear()}-${String(120 + i).padStart(6, '0')}`,
      compagnieId: 'c-lagune',
      gareDepartId: versAbidjan ? 'g-yam' : 'g-adj',
      gareArriveeId: versAbidjan ? 'g-adj' : 'g-yam',
      voyageId: idx >= 3 ? 'vo-2' : undefined,
      expediteur: { nom: `${pick(prenoms)} ${pick(noms)}`, telephone: `05${String(Math.floor(rnd() * 1e8)).padStart(8, '0')}` },
      destinataire: { nom: `${pick(prenoms)} ${pick(noms)}`, telephone: `01${String(Math.floor(rnd() * 1e8)).padStart(8, '0')}` },
      nature: pick(natures),
      poidsKg: poids,
      valeurDeclaree: Math.round(rnd() * 200) * 1000,
      montant: Math.max(1500, Math.round((poids * 250) / 100) * 100 + 1000),
      statut,
      historique,
      preuveRemise: statut === 'remis' ? { recuPar: 'Destinataire', piece: 'CNI C0012345', date: jourIso(-1, 15) } : undefined,
    })
  }

  // ——— BUSINESS ———
  const fournisseurs: Fournisseur[] = [
    { id: 'f-agence', nom: 'Agence Location Abidjan (démo)', type: 'agence', statut: 'validee', telephone: '+225 27 22 00 00 10', villeId: 'v-abj', vtc: false, creeLe: jourIso(-80) },
    { id: 'f-vtc', nom: 'Kouassi VTC (démo)', type: 'proprietaire', statut: 'validee', telephone: '+225 07 00 00 00 62', villeId: 'v-abj', vtc: true, creeLe: jourIso(-40) },
    { id: 'f-lagune', nom: 'Lagune Express — location de cars (démo)', type: 'compagnie', statut: 'validee', telephone: '+225 27 20 00 00 01', villeId: 'v-abj', vtc: false, creeLe: jourIso(-70) },
    { id: 'f-new', nom: 'Bouaké Auto Location (démo)', type: 'agence', statut: 'en_attente', telephone: '+225 27 31 00 00 11', villeId: 'v-bke', vtc: false, creeLe: jourIso(-1) },
  ]
  const vehiculesLocation: VehiculeLocation[] = [
    { id: 'vl-1', fournisseurId: 'f-agence', titre: 'Toyota Corolla 2022', categorie: 'berline', places: 4, mode: 'standard', avecChauffeur: true, sansChauffeur: true, villeId: 'v-abj', tarifJour: 35000, tarifDemiJour: 20000, supplementExterieurJour: 10000, statut: 'publie' },
    { id: 'vl-2', fournisseurId: 'f-agence', titre: 'Toyota Land Cruiser Prado', categorie: '4x4', places: 7, mode: 'standard', avecChauffeur: true, sansChauffeur: false, villeId: 'v-abj', tarifJour: 85000, tarifDemiJour: 50000, supplementExterieurJour: 20000, statut: 'publie' },
    { id: 'vl-3', fournisseurId: 'f-agence', titre: 'Hyundai Tucson', categorie: 'suv', places: 5, mode: 'standard', avecChauffeur: true, sansChauffeur: true, villeId: 'v-abj', tarifJour: 45000, tarifDemiJour: 25000, supplementExterieurJour: 12000, statut: 'brouillon' },
    { id: 'vl-4', fournisseurId: 'f-vtc', titre: 'Kia K5 — VTC', categorie: 'berline', places: 4, mode: 'vtc', avecChauffeur: true, sansChauffeur: false, villeId: 'v-abj', tarifJour: 40000, tarifDemiJour: 22000, supplementExterieurJour: 15000, statut: 'publie' },
    { id: 'vl-5', fournisseurId: 'f-lagune', titre: 'Car 70 places (mariages, séminaires)', categorie: 'car', places: 70, mode: 'standard', avecChauffeur: true, sansChauffeur: false, villeId: 'v-abj', tarifJour: 350000, tarifDemiJour: 200000, supplementExterieurJour: 100000, statut: 'publie' },
  ]
  const indisponibilites: Indisponibilite[] = [
    { id: 'in-1', vehiculeId: 'vl-1', debut: dateIso(2), fin: dateIso(4), motif: 'location' },
    { id: 'in-2', vehiculeId: 'vl-2', debut: dateIso(8), fin: dateIso(9), motif: 'maintenance' },
  ]
  const demande = (
    i: number,
    vehiculeId: string,
    fournisseurId: string,
    statut: DemandeLocation['statut'],
    debut: number,
    jours: number,
    montant: number,
    extra: Partial<DemandeLocation> = {},
  ): DemandeLocation => ({
    id: `dl-${i}`,
    numero: `LOC-MC-${new Date().getFullYear()}-${String(40 + i).padStart(6, '0')}`,
    vehiculeId,
    fournisseurId,
    client: { nom: `${pick(prenoms)} ${pick(noms)}`, telephone: `07${String(Math.floor(rnd() * 1e8)).padStart(8, '0')}` },
    debut: dateIso(debut),
    fin: dateIso(debut + jours - 1),
    zone: 'interieur',
    motif: 'Déplacement professionnel',
    personnes: 2,
    avecChauffeur: true,
    montant,
    statut,
    creeLe: jourIso(-1, 9 + i),
    ...extra,
  })
  const demandes: DemandeLocation[] = [
    demande(1, 'vl-1', 'f-agence', 'recue', 3, 2, 70000, { avecChauffeur: false, motif: 'Déplacement personnel' }),
    demande(2, 'vl-2', 'f-agence', 'recue', 5, 3, 315000, { zone: 'exterieur', destination: 'Yamoussoukro', motif: 'Mariage', personnes: 6 }),
    demande(3, 'vl-1', 'f-agence', 'payee', 2, 3, 105000),
    demande(4, 'vl-2', 'f-agence', 'terminee', -6, 2, 170000, { motif: 'Tourisme' }),
    demande(5, 'vl-4', 'f-vtc', 'recue', 1, 1, 40000, { motif: 'Transfert' }),
    demande(6, 'vl-4', 'f-vtc', 'refusee', 0, 1, 40000, { motifRefus: 'Véhicule déjà réservé sur ce créneau.' }),
    demande(7, 'vl-5', 'f-lagune', 'acceptee', 10, 1, 350000, { motif: 'Séminaire', personnes: 55, zone: 'exterieur', destination: 'Grand-Bassam' }),
  ]

  const promotions: Promotion[] = [
    { id: 'p-1', titre: '-15 % sur Abidjan → Yamoussoukro le mardi', description: 'Tous les départs du mardi.', auteurType: 'compagnie', auteurId: 'c-lagune', auteurNom: 'Lagune Express (démo)', cible: 'voyage', reductionPct: 15, debut: dateIso(-10), fin: dateIso(20), statut: 'validee' },
    { id: 'p-2', titre: 'Colis : -10 % au-dessus de 10 kg', description: 'Sur toutes les gares Lagune.', auteurType: 'compagnie', auteurId: 'c-lagune', auteurNom: 'Lagune Express (démo)', cible: 'colis', reductionPct: 10, debut: dateIso(1), fin: dateIso(30), statut: 'soumise' },
    { id: 'p-3', titre: 'Week-end SUV à -20 %', description: 'Du vendredi au dimanche.', auteurType: 'fournisseur', auteurId: 'f-agence', auteurNom: 'Agence Location Abidjan (démo)', cible: 'location', reductionPct: 20, debut: dateIso(2), fin: dateIso(40), statut: 'soumise' },
    { id: 'p-4', titre: 'Rentrée scolaire', description: 'Brouillon en préparation.', auteurType: 'compagnie', auteurId: 'c-lagune', auteurNom: 'Lagune Express (démo)', cible: 'voyage', reductionPct: 10, debut: dateIso(15), fin: dateIso(45), statut: 'brouillon' },
  ]

  const programmes: ProgrammeFidelite[] = [
    { id: 'pf-moncar', nom: 'MON CAR Fidélité', porteurType: 'moncar', pointsPour1000F: 1, valeurPointF: 10, validiteMois: 12, actif: true, membres: 18420, pointsEmis: 912000, pointsUtilises: 214000 },
    { id: 'pf-lagune', nom: 'Carte Lagune Plus', porteurType: 'compagnie', porteurId: 'c-lagune', pointsPour1000F: 2, valeurPointF: 5, validiteMois: 6, actif: true, membres: 3120, pointsEmis: 188000, pointsUtilises: 41000 },
  ]

  const litiges: Litige[] = [
    { id: 'lt-1', numero: 'LIT-2026-0012', type: 'colis', objet: 'Colis COL-MC abîmé à l’arrivée', plaignant: 'Aya Kouassi', misEnCause: 'Lagune Express (démo)', compagnieId: 'c-lagune', statut: 'ouvert', creeLe: jourIso(-1, 16), historique: [{ date: jourIso(-1, 16), auteur: 'Aya Kouassi', action: 'Réclamation ouverte depuis l’app client' }] },
    { id: 'lt-2', numero: 'LIT-2026-0011', type: 'location', objet: 'Rayure constatée à la restitution contestée', plaignant: 'Yao Traoré', misEnCause: 'Agence Location Abidjan (démo)', fournisseurId: 'f-agence', statut: 'en_cours', creeLe: jourIso(-4, 10), historique: [{ date: jourIso(-4, 10), auteur: 'Yao Traoré', action: 'Contestation des frais de restitution' }, { date: jourIso(-3, 9), auteur: 'Carine Loba (support)', action: 'Photos avant/après demandées à l’agence' }] },
    { id: 'lt-3', numero: 'LIT-2026-0009', type: 'paiement', objet: 'Paiement débité sans billet émis', plaignant: 'Koffi Bamba', misEnCause: 'Lagune Express (démo)', compagnieId: 'c-lagune', statut: 'resolu', creeLe: jourIso(-9, 8), historique: [{ date: jourIso(-9, 8), auteur: 'Koffi Bamba', action: 'Réclamation ouverte' }, { date: jourIso(-8, 14), auteur: 'Carine Loba (support)', action: 'Billet réémis après vérification CinetPay' }], decision: 'Billet réémis, aucun remboursement nécessaire.' },
  ]

  const audit: EntreeAudit[] = [
    { id: 'au-1', date: jourIso(-1, 21, 2), auteur: 'Fatou Ouattara', poste: 'caisse', action: 'Clôture de caisse avec écart', entite: 'session_caisse', entiteId: 'sc-1', avant: { statut: 'ouverte' }, apres: { statut: 'cloturee', ecart: -2000 }, compagnieId: 'c-lagune' },
    { id: 'au-2', date: jourIso(-2, 10, 15), auteur: 'Nadia Kacou', poste: 'admin_super', action: 'Modification du taux de commission', entite: 'parametres_plateforme', entiteId: 'plateforme', avant: { commissionVoyagePct: 4 }, apres: { commissionVoyagePct: 5 } },
    { id: 'au-3', date: jourIso(-3, 8, 40), auteur: 'Serge N’Guessan', poste: 'flotte', action: 'Véhicule mis en maintenance', entite: 'vehicule', entiteId: 've-4', avant: { etat: 'disponible' }, apres: { etat: 'maintenance' }, compagnieId: 'c-lagune' },
  ]

  return {
    version: MOCK_DB_VERSION,
    generatedOn: jourDe(now),
    villes,
    compagnies,
    gares,
    categories,
    comptes,
    motsDePasse,
    lignes,
    vehicules,
    voyages,
    reservations,
    sessionsCaisse,
    ecritures,
    reversements,
    rapprochements,
    colis,
    fournisseurs,
    vehiculesLocation,
    indisponibilites,
    demandes,
    promotions,
    programmes,
    litiges,
    audit,
    parametres: {
      commissionVoyagePct: 5,
      fraisOperationVoyage: 200,
      fraisOperationColis: 300,
      commissionLocationPct: 10,
      dureeBlocageSiegeMin: 10,
      periodiciteReversement: 'hebdomadaire',
    },
    sequences: { billet: seqBillet, colis: 200, demande: 60, litige: 13, audit: 4 },
  }
}
