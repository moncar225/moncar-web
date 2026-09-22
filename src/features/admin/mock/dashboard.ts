/**
 * ⚠️ DONNÉES MOCK — démonstration UI uniquement (Prompt 2).
 * Chiffres d'administration fictifs. Aucun lien avec le backend MON CAR.
 */

import type { StatCard, ActivityItem } from '@/features/compagnie/mock/dashboard'

export const adminStats: StatCard[] = [
  { id: 'users', label: 'Utilisateurs', value: '4 218', delta: '+120 cette semaine', deltaDirection: 'up' },
  { id: 'compagnies', label: 'Compagnies', value: '31', delta: '2 en attente de validation', deltaDirection: 'down' },
  { id: 'business', label: 'Partenaires business', value: '58', delta: '+5 ce mois', deltaDirection: 'up' },
  { id: 'audit', label: 'Alertes audit', value: '3', delta: 'à examiner', deltaDirection: 'down' },
]

export const adminActivity: ActivityItem[] = [
  { id: 'aa1', time: '10:12', text: 'Compagnie « mock Transport CI » créée (mock)' },
  { id: 'aa2', time: '09:47', text: 'Tentative de connexion suspecte bloquée (mock)' },
  { id: 'aa3', time: '09:20', text: 'Nouveau partenaire business validé (mock)' },
]
