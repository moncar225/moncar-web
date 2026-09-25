/**
 * Espace BUSINESS (LOC-001 → LOC-006) : véhicules de location (dont VTC),
 * disponibilités, demandes, revenus. Chemins de la roadmap §9.7.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { httpClient } from '@/api/client'
import type { DemandeLocation, Fournisseur, Indisponibilite, VehiculeLocation } from '@/domain/types'

export interface Revenus {
  tauxCommission: number
  enSequestre: number
  regleBrut: number
  regleNet: number
  parMois: Array<{ mois: string; locations: number; brut: number; commission: number; net: number }>
}

export interface DemandeDetail extends DemandeLocation {
  vehicule: string
}

export interface TableauBusiness {
  fournisseur: Fournisseur
  vehiculesPublies: number
  vehicules: number
  demandesATraiter: number
  locationsEnCours: number
  revenus: Revenus
  prochaines: DemandeDetail[]
}

export type PeriodeIndispo = Indisponibilite & { demande?: string }

export const useTableauBusiness = () =>
  useQuery({ queryKey: ['business', 'tableau'], queryFn: () => httpClient.get<TableauBusiness>('/business/tableau-de-bord') })
export const useVehiculesLocation = () =>
  useQuery({ queryKey: ['business', 'vehicules'], queryFn: () => httpClient.get<VehiculeLocation[]>('/business/vehicules') })
export const useDisponibilites = () =>
  useQuery({ queryKey: ['business', 'disponibilites'], queryFn: () => httpClient.get<PeriodeIndispo[]>('/business/disponibilites') })
export const useDemandes = () =>
  useQuery({ queryKey: ['business', 'demandes'], queryFn: () => httpClient.get<DemandeDetail[]>('/business/demandes') })
export const useRevenus = () => useQuery({ queryKey: ['business', 'revenus'], queryFn: () => httpClient.get<Revenus>('/business/revenus') })

function useEcriture<TVars, TRes>(fn: (v: TVars) => Promise<TRes>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => void qc.invalidateQueries({ queryKey: ['business'] }) })
}

export const useCreerVehiculeLocation = () =>
  useEcriture((v: Partial<VehiculeLocation>) => httpClient.post<VehiculeLocation>('/business/vehicules', { body: v }))
export const useModifierVehiculeLocation = () =>
  useEcriture(({ id, ...v }: Partial<VehiculeLocation> & { id: string }) =>
    httpClient.patch<VehiculeLocation>(`/business/vehicules/${id}`, { body: v }),
  )
export const useAjouterIndispo = () =>
  useEcriture((v: { vehiculeId: string; debut: string; fin: string; motif: 'maintenance' | 'indisponible' }) =>
    httpClient.post<Indisponibilite>('/business/disponibilites', { body: v }),
  )
export const useSupprimerIndispo = () => useEcriture((id: string) => httpClient.delete(`/business/disponibilites/${id}`))
export const useRepondreDemande = () =>
  useEcriture(({ id, ...v }: { id: string; decision: 'acceptee' | 'refusee'; motif?: string }) =>
    httpClient.post<DemandeLocation>(`/locations/demandes/${id}/reponse`, { body: v }),
  )
