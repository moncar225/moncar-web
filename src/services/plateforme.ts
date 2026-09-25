/**
 * Finances (PAY-002), tableaux de bord, paramètres plateforme, promotions
 * (PRO-001), fidélité (FID-001), litiges (AUD-002), audit (AUD-001).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { httpClient } from '@/api/client'
import type {
  Ecriture,
  EntreeAudit,
  Litige,
  ParametresPlateforme,
  ProgrammeFidelite,
  Promotion,
  Rapprochement,
  Reversement,
  StatutVoyage,
} from '@/domain/types'

export interface TableauCompagnie {
  voyagesDuJour: number
  enRoute: number
  billetsDuJour: number
  recettesDuJour: number
  remplissageMoyen: number
  colisEnCours: number
  caissesOuvertes: number
  serie: Array<{ jour: string; app: number; guichet: number }>
  alertes: string[]
  prochainsDeparts: Array<{ id: string; depart: string; reference: string; ligne: string; statut: StatutVoyage }>
}

export interface TableauAdmin {
  compagniesValidees: number
  dossiersEnAttente: number
  fournisseurs: number
  billetsVendus: number
  volumeVentes: number
  commissions: number
  litigesOuverts: number
  promotionsAValider: number
  ecartsRapprochement: number
}

export interface SyntheseFinanciere {
  ventesApp: number
  ventesGuichet: number
  commissions: number
  remboursements: number
  soldeDuParMonCar: number
  dejaReverse: number
}

const get = <T,>(chemin: string, query?: Record<string, string>) => () => httpClient.get<T>(chemin, { query })

export const useTableauCompagnie = () =>
  useQuery({ queryKey: ['tableau', 'compagnie'], queryFn: get<TableauCompagnie>('/tableau-de-bord'), refetchInterval: 60_000 })
export const useTableauAdmin = () => useQuery({ queryKey: ['tableau', 'admin'], queryFn: get<TableauAdmin>('/admin/tableau-de-bord') })
export const useSynthese = () => useQuery({ queryKey: ['finances', 'synthese'], queryFn: get<SyntheseFinanciere>('/finances/synthese') })
export const useEcritures = (du: string, au: string, journal: string) =>
  useQuery({
    queryKey: ['finances', 'ecritures', du, au, journal],
    queryFn: get<Ecriture[]>('/finances/ecritures', { du, au, ...(journal === '' ? {} : { journal }) }),
  })
export const useReversements = () => useQuery({ queryKey: ['finances', 'reversements'], queryFn: get<Reversement[]>('/finances/reversements') })
export const useRapprochements = () =>
  useQuery({ queryKey: ['finances', 'rapprochements'], queryFn: get<Rapprochement[]>('/finances/rapprochements') })
export const useParametresPlateforme = () =>
  useQuery({ queryKey: ['plateforme', 'parametres'], queryFn: get<ParametresPlateforme>('/plateforme/parametres') })
export const usePromotions = () => useQuery({ queryKey: ['promotions'], queryFn: get<Promotion[]>('/promotions') })
export const useProgrammes = () => useQuery({ queryKey: ['fidelite'], queryFn: get<ProgrammeFidelite[]>('/fidelite/programmes') })
export const useLitiges = () => useQuery({ queryKey: ['litiges'], queryFn: get<Litige[]>('/litiges') })
export const useAudit = (q: string) => useQuery({ queryKey: ['audit', q], queryFn: get<EntreeAudit[]>('/audit/journal', { q }) })

function useEcriture<TVars, TRes>(fn: (v: TVars) => Promise<TRes>, invalider: ReadonlyArray<readonly unknown[]>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const k of invalider) void qc.invalidateQueries({ queryKey: k })
    },
  })
}

export const useModifierParametres = () =>
  useEcriture(
    (v: Partial<ParametresPlateforme>) => httpClient.patch<ParametresPlateforme>('/plateforme/parametres', { body: v }),
    [['plateforme'], ['audit']],
  )
export const useCreerPromotion = () =>
  useEcriture((v: Partial<Promotion>) => httpClient.post<Promotion>('/promotions', { body: v }), [['promotions']])
export const useSoumettrePromotion = () =>
  useEcriture((id: string) => httpClient.post<Promotion>(`/promotions/${id}/soumission`), [['promotions']])
export const useValiderPromotion = () =>
  useEcriture(
    ({ id, ...v }: { id: string; decision: 'validee' | 'refusee'; motif?: string }) =>
      httpClient.post<Promotion>(`/promotions/${id}/validation`, { body: v }),
    [['promotions'], ['tableau']],
  )
export const useModifierProgramme = () =>
  useEcriture(
    ({ id, ...v }: Partial<ProgrammeFidelite> & { id: string }) => httpClient.patch<ProgrammeFidelite>(`/fidelite/programmes/${id}`, { body: v }),
    [['fidelite']],
  )
export const useActionLitige = () =>
  useEcriture(
    ({ id, ...v }: { id: string; action: string; statut?: Litige['statut']; decision?: string }) =>
      httpClient.post<Litige>(`/litiges/${id}/actions`, { body: v }),
    [['litiges'], ['tableau']],
  )
