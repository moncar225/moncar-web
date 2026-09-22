/**
 * ⚠️ DONNÉES MOCK — démonstration UI uniquement (Prompt 2).
 * Ces chiffres n'ont AUCUN lien avec le backend MON CAR : ils sont en dur,
 * identifiés comme mock, et seront remplacés par les vraies données
 * (TanStack Query + contrat OpenAPI) plus tard.
 */

export interface StatCard {
  id: string
  label: string
  value: string
  delta: string
  deltaDirection: 'up' | 'down'
}

export interface ActivityItem {
  id: string
  time: string
  text: string
}

export interface EventItem {
  id: string
  time: string
  text: string
}

export const compagnieStats: StatCard[] = [
  { id: 'voyages', label: 'Voyages aujourd\u2019hui', value: '12', delta: '+2 vs hier', deltaDirection: 'up' },
  { id: 'reservations', label: 'Réservations', value: '128', delta: '+9 % cette semaine', deltaDirection: 'up' },
  { id: 'vehicules', label: 'Véhicules en service', value: '24', delta: '3 en maintenance', deltaDirection: 'down' },
  { id: 'remplissage', label: 'Taux de remplissage', value: '78 %', delta: '+4 pts vs hier', deltaDirection: 'up' },
]

export const compagnieActivity: ActivityItem[] = [
  { id: 'a1', time: '09:42', text: 'Réservation 14 places — Trajet ABJ · Yamoussoukro (mock)' },
  { id: 'a2', time: '09:15', text: 'Nouvel agent enregistré au siège (mock)' },
  { id: 'a3', time: '08:57', text: 'Départ de bus confirmé — quai 3 (mock)' },
  { id: 'a4', time: '08:30', text: 'Paiement reçu pour la réservation n° MK-0417 (mock)' },
]

export const compagnieEvents: EventItem[] = [
  { id: 'e1', time: '11:00', text: 'Départ ABJ → Bouaké (mock)' },
  { id: 'e2', time: '14:30', text: 'Maintenance prévue — véhicule n° V-08 (mock)' },
  { id: 'e3', time: '17:45', text: 'Retour Yamoussoukro → ABJ (mock)' },
]
