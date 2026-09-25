/**
 * Référentiels, compagnies, gares, fournisseurs et comptes (REF-001, AUTH-003).
 * Chemins de la roadmap §9.1 / §9.2 — seront remplacés par le client généré.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { httpClient } from '@/api/client'
import type {
  CategorieVehicule,
  Compagnie,
  Compte,
  Fournisseur,
  Gare,
  StatutValidation,
  Ville,
} from '@/domain/types'

export const cles = {
  villes: ['villes'] as const,
  categories: ['categories-vehicules'] as const,
  compagnies: ['compagnies'] as const,
  compagnie: (id: string) => ['compagnies', id] as const,
  gares: ['gares'] as const,
  fournisseurs: ['fournisseurs'] as const,
  utilisateurs: ['utilisateurs'] as const,
}

export const useVilles = () => useQuery({ queryKey: cles.villes, queryFn: () => httpClient.get<Ville[]>('/villes'), staleTime: 300_000 })
export const useCategories = () =>
  useQuery({ queryKey: cles.categories, queryFn: () => httpClient.get<CategorieVehicule[]>('/categories-vehicules'), staleTime: 300_000 })
export const useCompagnies = () => useQuery({ queryKey: cles.compagnies, queryFn: () => httpClient.get<Compagnie[]>('/compagnies') })
export const useCompagnie = (id: string | undefined) =>
  useQuery({
    queryKey: cles.compagnie(id ?? ''),
    queryFn: () => httpClient.get<Compagnie>(`/compagnies/${id ?? ''}`),
    enabled: id !== undefined,
  })
export const useGares = () => useQuery({ queryKey: cles.gares, queryFn: () => httpClient.get<Gare[]>('/gares') })
export const useFournisseurs = () =>
  useQuery({ queryKey: cles.fournisseurs, queryFn: () => httpClient.get<Fournisseur[]>('/fournisseurs') })
export const useUtilisateurs = () =>
  useQuery({ queryKey: cles.utilisateurs, queryFn: () => httpClient.get<Compte[]>('/utilisateurs') })

/** Mutation qui invalide les clés données au succès. */
function useEcriture<TVars, TRes>(fn: (v: TVars) => Promise<TRes>, invalider: ReadonlyArray<readonly unknown[]>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const k of invalider) void qc.invalidateQueries({ queryKey: k })
    },
  })
}

export const useCreerVille = () =>
  useEcriture((v: { nom: string; region: string }) => httpClient.post<Ville>('/villes', { body: v }), [cles.villes])
export const useCreerCategorie = () =>
  useEcriture(
    (v: { nom: string; usage: CategorieVehicule['usage'] }) => httpClient.post<CategorieVehicule>('/categories-vehicules', { body: v }),
    [cles.categories],
  )
export const useCreerCompagnie = () =>
  useEcriture((v: Partial<Compagnie>) => httpClient.post<Compagnie>('/compagnies', { body: v }), [cles.compagnies])
export const useModifierCompagnie = () =>
  useEcriture(
    ({ id, ...v }: Partial<Compagnie> & { id: string }) => httpClient.patch<Compagnie>(`/compagnies/${id}`, { body: v }),
    [cles.compagnies],
  )

export interface Decision {
  id: string
  decision: Exclude<StatutValidation, 'en_attente'>
  motif?: string
}
export const useDeciderCompagnie = () =>
  useEcriture(
    ({ id, ...v }: Decision) => httpClient.post<Compagnie>(`/compagnies/${id}/validation`, { body: v }),
    [cles.compagnies],
  )
export const useDeciderFournisseur = () =>
  useEcriture(
    ({ id, ...v }: Decision) => httpClient.post<Fournisseur>(`/fournisseurs/${id}/validation`, { body: v }),
    [cles.fournisseurs],
  )

export const useCreerGare = () => useEcriture((v: Partial<Gare>) => httpClient.post<Gare>('/gares', { body: v }), [cles.gares])
export const useModifierGare = () =>
  useEcriture(({ id, ...v }: Partial<Gare> & { id: string }) => httpClient.patch<Gare>(`/gares/${id}`, { body: v }), [cles.gares])

export const useCreerCompte = () =>
  useEcriture(
    (v: Partial<Compte>) => httpClient.post<{ compte: Compte; motDePasseTemporaire: string }>('/utilisateurs', { body: v }),
    [cles.utilisateurs],
  )
export const useModifierCompte = () =>
  useEcriture(
    ({ id, ...v }: Partial<Compte> & { id: string }) => httpClient.patch<Compte>(`/utilisateurs/${id}`, { body: v }),
    [cles.utilisateurs],
  )
export const useReinitialiserCompte = () =>
  useEcriture(
    (id: string) => httpClient.post<{ motDePasseTemporaire: string }>(`/utilisateurs/${id}/reinitialisation`),
    [cles.utilisateurs],
  )
