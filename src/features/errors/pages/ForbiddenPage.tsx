import { Link, useLocation } from 'react-router-dom'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ErrorLayout } from '../components/ErrorLayout'

/** Page 403 — accès interdit (rôle insuffisant). */
export function ForbiddenPage() {
  useDocumentTitle('MON CAR — Accès interdit')
  const state = useLocation().state as { motif?: string } | null
  return (
    <ErrorLayout code="403" titleId="forbidden-title">
      <h1 id="forbidden-title">Accès interdit</h1>
      <p>Vous n&rsquo;avez pas les droits nécessaires pour accéder à cet espace.</p>
      {state?.motif !== undefined && <p className="state-block__motif">{state.motif}</p>}
      <div className="state-block__actions">
        <Link to="/" className="mc-btn mc-btn--primary">
          Retour à l&rsquo;accueil
        </Link>
        <Link to="/connexion" className="mc-btn mc-btn--outline">
          Changer de compte
        </Link>
      </div>
    </ErrorLayout>
  )
}
