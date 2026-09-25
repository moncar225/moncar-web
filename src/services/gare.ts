/**
 * Postes de gare : caisse (CAI-001), exploitation et manifeste (MAN-001/002),
 * service colis (COL-002). Chemins de la roadmap §9.4–§9.6.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { httpClient } from '@/api/client'
import type { Colis, EtapeColis, MoyenPaiement, Reservation, SessionCaisse, StatutReservation } from '@/domain/types'
import type { VoyageResume } from './exploitation'

export interface VenteJournal extends Reservation {
  voyageReference: string
  depart: string
  trajet: string
}

export interface JournalCaisse {
  session: SessionCaisse
  ventes: VenteJournal[]
  totalVentes: number
  nombreBillets: number
  parMoyen: Partial<Record<MoyenPaiement, number>>
  especesAttendues: number
}

export interface BilletEmis extends VenteJournal {
  compagnie: string
}

export interface ResultatVente {
  billets: BilletEmis[]
  total: number
  prixUnitaire: number
}

export interface SessionCaisseResume extends SessionCaisse {
  caissier: string
  gare: string
  totalVentes: number
  nombreBillets: number
  especesAttendues: number
}

export interface LigneTableau extends VoyageResume {
  sens: 'depart' | 'arrivee' | 'passage'
  ordreGare: number
  heureGare: string
  aEmbarquer: number
  embarques: number
  aDebarquer: number
}

export interface Manifeste {
  voyage: VoyageResume
  capacite: number
  embarques: number
  genereLe: string
  passagers: Array<{
    billetNumero: string
    siege: string
    passager: string
    telephone: string
    montee: string
    descente: string
    statut: StatutReservation
    canal: 'app' | 'guichet'
    bagages: number
  }>
  arrets: Array<{ ordre: number; nom: string; heurePrevue: string; montees: number; descentes: number; aBordApres: number }>
  colis: Array<{ numero: string; nature: string; poidsKg: number; statut: EtapeColis }>
}

export interface GareSuivante {
  voyage: VoyageResume
  suivante: {
    ordre: number
    arret: string
    heureEstimee: string
    retardMinutes: number
    aDebarquer: Array<{ siege: string; passager: string; bagages: number }>
    aEmbarquer: Array<{ siege: string; passager: string }>
    siegesLiberes: string[]
    bagagesADecharger: number
    colisADecharger: Array<{ numero: string; nature: string; destinataire: string }>
  } | null
}

export const clesGare = {
  caisse: ['caisse', 'courante'] as const,
  sessions: ['caisse', 'sessions'] as const,
  tableau: (gareId: string, date: string) => ['gare', gareId, 'tableau', date] as const,
  manifeste: (voyageId: string) => ['manifeste', voyageId] as const,
  suivante: (voyageId: string) => ['gare-suivante', voyageId] as const,
  colis: (gareId: string) => ['colis', gareId] as const,
}

export const useCaisseCourante = () =>
  useQuery({ queryKey: clesGare.caisse, queryFn: () => httpClient.get<JournalCaisse | null>('/caisse/session-courante') })
export const useSessionsCaisse = () =>
  useQuery({ queryKey: clesGare.sessions, queryFn: () => httpClient.get<SessionCaisseResume[]>('/caisse/sessions') })
export const useTableauGare = (gareId: string | undefined, date: string) =>
  useQuery({
    queryKey: clesGare.tableau(gareId ?? '', date),
    queryFn: () => httpClient.get<LigneTableau[]>(`/gares/${gareId ?? ''}/tableau`, { query: { date } }),
    enabled: gareId !== undefined,
    refetchInterval: 30_000,
  })
export const useManifeste = (voyageId: string | null) =>
  useQuery({
    queryKey: clesGare.manifeste(voyageId ?? ''),
    queryFn: () => httpClient.get<Manifeste>(`/voyages/${voyageId ?? ''}/manifeste`),
    enabled: voyageId !== null,
  })
export const useGareSuivante = (voyageId: string | null) =>
  useQuery({
    queryKey: clesGare.suivante(voyageId ?? ''),
    queryFn: () => httpClient.get<GareSuivante>(`/voyages/${voyageId ?? ''}/information-gare-suivante`),
    enabled: voyageId !== null,
    refetchInterval: 20_000,
  })
export const useColisGare = (gareId: string | undefined) =>
  useQuery({
    queryKey: clesGare.colis(gareId ?? ''),
    queryFn: () => httpClient.get<Colis[]>(`/gares/${gareId ?? ''}/colis`),
    enabled: gareId !== undefined,
  })

function useEcriture<TVars, TRes>(fn: (v: TVars) => Promise<TRes>, invalider: ReadonlyArray<readonly unknown[]>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const k of invalider) void qc.invalidateQueries({ queryKey: k })
    },
  })
}

export const useOuvrirCaisse = () =>
  useEcriture((fondInitial: number) => httpClient.post<JournalCaisse>('/caisse/sessions', { body: { fondInitial } }), [clesGare.caisse])

export interface Vente {
  voyageId: string
  montee: number
  descente: number
  moyen: MoyenPaiement
  passagers: Array<{ siege: string; nom: string; telephone: string; bagages: number }>
}

/** Vente guichet — une Idempotency-Key par tentative (rejeu sans doublon). */
export function useVendre() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ vente, cle }: { vente: Vente; cle: string }) =>
      httpClient.post<ResultatVente>('/caisse/ventes', { body: vente, headers: { 'Idempotency-Key': cle }, skipIdempotency: true }),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: clesGare.caisse })
      void qc.invalidateQueries({ queryKey: ['voyages'] })
    },
  })
}

export const useAnnulerBillet = () =>
  useEcriture(
    ({ id, motif }: { id: string; motif: string }) => httpClient.post<Reservation>(`/reservations/${id}/annulation`, { body: { motif } }),
    [clesGare.caisse, ['voyages']],
  )
export const useCloturerCaisse = () =>
  useEcriture(
    ({ id, montantDeclare, commentaire }: { id: string; montantDeclare: number; commentaire?: string }) =>
      httpClient.post<JournalCaisse>(`/caisse/${id}/cloture`, { body: { montantDeclare, commentaire } }),
    [clesGare.caisse, clesGare.sessions],
  )
export const useProgression = () =>
  useEcriture(
    ({ id, action }: { id: string; action: 'embarquement' | 'depart' | 'passage' }) =>
      httpClient.post<VoyageResume>(`/voyages/${id}/progression`, { body: { action } }),
    [['gare'], ['manifeste'], ['gare-suivante'], ['voyages']],
  )

export const useDevisColis = () =>
  useMutation({
    mutationFn: (v: { poidsKg: number; valeurDeclaree: number }) =>
      httpClient.post<{ montant: number; fraisOperation: number }>('/colis/devis', { body: v, skipIdempotency: true }),
  })
export const useCreerColis = () =>
  useEcriture((v: Record<string, unknown>) => httpClient.post<Colis>('/colis', { body: v }), [['colis']])
export const useEtapeColis = () =>
  useEcriture(
    ({ id, etape, voyageId }: { id: string; etape: EtapeColis; voyageId?: string }) =>
      httpClient.post<Colis>(`/colis/${id}/etapes`, { body: { etape, voyageId } }),
    [['colis']],
  )
export const useRemiseColis = () =>
  useEcriture(
    ({ id, recuPar, piece }: { id: string; recuPar: string; piece: string }) =>
      httpClient.post<Colis>(`/colis/${id}/remise`, { body: { recuPar, piece } }),
    [['colis']],
  )
