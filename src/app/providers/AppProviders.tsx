import { useState } from 'react'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './AuthProvider'
import { ToastProvider } from '@/components/ui'
import { createQueryClient } from './queryClient'
import type { SessionUser } from '@/types/auth'

interface AppProvidersProps {
  children: ReactNode
  /** Voir `AuthProvider` — seam de test, aucune requête émise. */
  initialSession?: SessionUser | null
}

/** Providers globaux de moncar-web : TanStack Query + authentification + notifications. */
export function AppProviders({ children, initialSession }: AppProvidersProps) {
  const [queryClient] = useState(createQueryClient)
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialSession={initialSession}>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
