import { PageLoader } from '@/components/PageLoader'
import { useAuth } from '../providers/AuthProvider'
import type { ReactNode } from 'react'

/**
 * Bloque le rendu tant que la session n'est pas établie.
 * États gérés : loading → PageLoader ; unauthenticated → écran dédié ;
 * authenticated → rendu des enfants.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  if (status === 'loading') {
    return <PageLoader label="Vérification de votre session…" />
  }

  if (status === 'unauthenticated') {
    return (
      <section className="state-block" aria-labelledby="auth-required-title">
        <h1 id="auth-required-title">Connexion requise</h1>
        <p>
          Vous devez être connecté pour accéder à cet espace. L&rsquo;authentification
          MON CAR sera connectée au backend dans un prochain sprint.
        </p>
      </section>
    )
  }

  return children
}
