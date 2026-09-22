import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthStatus, SessionUser } from '@/types/auth'

interface AuthContextValue {
  status: AuthStatus
  session: SessionUser | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
  /**
   * Seam de test / intégration future : permet d'injecter une session sans
   * émettre la moindre requête. `undefined` = comportement normal
   * (restauration de session puis non-authentifié).
   */
  initialSession?: SessionUser | null
}

/**
 * État d'authentification de moncar-web.
 *
 * ⚠️ Fondation technique : AUCUN endpoint n'est appelé ici. La vraie
 * restauration de session (backend MON CAR) sera branchée ici lorsque le
 * contrat OpenAPI sera disponible. En attendant, l'état passe par `loading`
 * puis se résout en `unauthenticated`.
 */
export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const [state, setState] = useState<AuthContextValue>(() => {
    if (initialSession === undefined) {
      return { status: 'loading', session: null }
    }
    return initialSession === null
      ? { status: 'unauthenticated', session: null }
      : { status: 'authenticated', session: initialSession }
  })

  useEffect(() => {
    if (initialSession !== undefined) return
    // Restauration de session à venir (backend) — aucune requête émise ici.
    const timer = window.setTimeout(() => {
      setState({ status: 'unauthenticated', session: null })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [initialSession])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth doit être utilisé à l\u2019intérieur d\u2019un <AuthProvider>.')
  }
  return context
}
