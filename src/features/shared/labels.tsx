import { Badge } from '@/components/ui'
import type {
  EtapeColis,
  EtatVehicule,
  MoyenPaiement,
  StatutDemande,
  StatutPromotion,
  StatutReservation,
  StatutValidation,
  StatutVoyage,
} from '@/domain/types'

type Variante = 'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'danger'

const TABLES = {
  validation: {
    en_attente: ['En attente', 'warning'],
    validee: ['Validée', 'success'],
    suspendue: ['Suspendue', 'danger'],
    refusee: ['Refusée', 'danger'],
  } satisfies Record<StatutValidation, [string, Variante]>,
  voyage: {
    programme: ['Programmé', 'neutral'],
    embarquement: ['Embarquement', 'accent'],
    en_route: ['En route', 'primary'],
    arrive: ['Arrivé', 'success'],
    annule: ['Annulé', 'danger'],
  } satisfies Record<StatutVoyage, [string, Variante]>,
  reservation: {
    bloquee: ['Siège bloqué', 'warning'],
    payee: ['Payé', 'primary'],
    embarquee: ['À bord', 'success'],
    descendue: ['Descendu', 'neutral'],
    annulee: ['Annulé', 'danger'],
  } satisfies Record<StatutReservation, [string, Variante]>,
  vehicule: {
    disponible: ['Disponible', 'success'],
    en_service: ['En service', 'primary'],
    maintenance: ['Maintenance', 'warning'],
    hors_service: ['Hors service', 'danger'],
  } satisfies Record<EtatVehicule, [string, Variante]>,
  colis: {
    enregistre: ['Enregistré', 'neutral'],
    recu: ['Reçu', 'neutral'],
    controle: ['Contrôlé', 'primary'],
    charge: ['Chargé', 'primary'],
    en_transit: ['En transit', 'accent'],
    arrive: ['Arrivé', 'accent'],
    disponible: ['Disponible', 'success'],
    remis: ['Remis', 'success'],
  } satisfies Record<EtapeColis, [string, Variante]>,
  demande: {
    recue: ['À traiter', 'warning'],
    acceptee: ['Acceptée — attente paiement', 'primary'],
    refusee: ['Refusée', 'danger'],
    payee: ['Payée (séquestre)', 'success'],
    en_cours: ['En cours', 'accent'],
    terminee: ['Terminée', 'neutral'],
  } satisfies Record<StatutDemande, [string, Variante]>,
  promotion: {
    brouillon: ['Brouillon', 'neutral'],
    soumise: ['En validation', 'warning'],
    validee: ['Validée', 'success'],
    refusee: ['Refusée', 'danger'],
  } satisfies Record<StatutPromotion, [string, Variante]>,
}

export function StatutBadge<K extends keyof typeof TABLES>({ table, statut }: { table: K; statut: keyof (typeof TABLES)[K] }) {
  const entree = (TABLES[table] as Record<string, [string, Variante]>)[statut as string]
  if (entree === undefined) return <Badge>{String(statut)}</Badge>
  return <Badge variant={entree[1]}>{entree[0]}</Badge>
}

export const LIBELLES_ETAPE_COLIS: Record<EtapeColis, string> = Object.fromEntries(
  Object.entries(TABLES.colis).map(([k, v]) => [k, v[0]]),
) as Record<EtapeColis, string>

export const MOYENS: Record<MoyenPaiement, string> = {
  especes: 'Espèces',
  orange_money: 'Orange Money',
  mtn_momo: 'MTN MoMo',
  moov_money: 'Moov Money',
  wave: 'Wave',
  carte: 'Carte bancaire',
}
