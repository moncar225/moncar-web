/**
 * ⚠️ DONNÉES MOCK — démonstration UI uniquement (Prompt 2).
 * Entités fictives pour illustrer le sélecteur d'entité de l'espace
 * business. Aucun lien avec le backend MON CAR.
 */

export interface BusinessEntity {
  id: string
  name: string
  type: 'Agence de location' | 'Propriétaire' | 'Chauffeur VTC'
}

export const businessEntities: [BusinessEntity, ...BusinessEntity[]] = [
  { id: 'ent-1', name: 'Agence Location Abidjan', type: 'Agence de location' },
  { id: 'ent-2', name: 'Kouassi VTC', type: 'Chauffeur VTC' },
  { id: 'ent-3', name: 'Fleet KM (particulier)', type: 'Propriétaire' },
]

import type { StatCard, ActivityItem } from '@/features/compagnie/mock/dashboard'

export const businessStats: StatCard[] = [
  { id: 'locations', label: 'Locations actives', value: '17', delta: '+3 vs hier', deltaDirection: 'up' },
  { id: 'demandes', label: 'Demandes en attente', value: '5', delta: 'à traiter aujourd\u2019hui', deltaDirection: 'down' },
  { id: 'revenus', label: 'Revenus du mois (mock)', value: '1,2 M FCFA', delta: '+11 % vs mois dernier', deltaDirection: 'up' },
  { id: 'vehicules', label: 'Véhicules référencés', value: '9', delta: '2 indisponibles', deltaDirection: 'down' },
]

export const businessActivity: ActivityItem[] = [
  { id: 'ba1', time: '10:05', text: 'Demande de location avec chauffeur — 3 jours (mock)' },
  { id: 'ba2', time: '09:38', text: 'Location confirmée — SUV, prise à l\u2019aéroport (mock)' },
  { id: 'ba3', time: '08:52', text: 'Documents de véhicule à renouveler (mock)' },
]
