import { Link, useLocation } from 'react-router-dom'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/** Page 403 — accès interdit (rôle insuffisant). */
export function ForbiddenPage() {
  useDocumentTitle('MON CAR — Accès interdit')
  const state = useLocation().state as { motif?: string } | null
  return (
    <section className="state-block" aria-labelledby="forbidden-title">
      <p className="state-block__code">Erreur 403</p>
      <h1 id="forbidden-title">Accès interdit</h1>
      <p>Vous n&rsquo;avez pas les droits nécessaires pour accéder à cet espace.</p>
      {state?.motif !== undefined && <p className="muted">{state.motif}</p>}
      <Link to="/">Retour à l&rsquo;accueil</Link>
    </section>
  )
}
