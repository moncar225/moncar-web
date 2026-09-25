import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { PageLoader } from '@/components/PageLoader'
import { useAuth } from '../providers/AuthProvider'

/**
 * Bloque le rendu tant que la session n'est pas établie.
 * loading → PageLoader ; unauthenticated → page de connexion (avec retour) ;
 * mot de passe temporaire → changement obligatoire (CDC) ; sinon les enfants.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status, session } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <PageLoader label="Vérification de votre session…" />
  }

  if (status === 'unauthenticated') {
    return <Navigate to={`/connexion?retour=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (session?.motDePasseTemporaire === true) {
    return <Navigate to="/mot-de-passe" replace />
  }

  return children
}
