import { useState } from 'react'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './AuthProvider'
import { createQueryClient } from './queryClient'
import type { SessionUser } from '@/types/auth'

interface AppProvidersProps {
  children: ReactNode
  /** Voir `AuthProvider` — seam de test, aucune requête émise. */
  initialSession?: SessionUser | null
}

/** Providers globaux de moncar-web : TanStack Query + authentification. */
export function AppProviders({ children, initialSession }: AppProvidersProps) {
  const [queryClient] = useState(createQueryClient)
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialSession={initialSession}>{children}</AuthProvider>
    </QueryClientProvider>
  )
}
