import { QueryClient } from '@tanstack/react-query'

/**
 * Fabric du QueryClient central de moncar-web.
 * Aucune requête métier n'est enregistrée ici : les futures features
 * déclareront leurs queryKeys/services une fois le contrat OpenAPI disponible.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
}
