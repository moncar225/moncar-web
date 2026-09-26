import { Link } from 'react-router-dom'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ErrorLayout } from '../components/ErrorLayout'

/** Page 404 — ressource introuvable. */
export function NotFoundPage() {
  useDocumentTitle('MON CAR — Page introuvable')
  return (
    <ErrorLayout code="404" titleId="not-found-title">
      <h1 id="not-found-title">Page introuvable</h1>
      <p>La page demandée n&rsquo;existe pas ou a été déplacée.</p>
      <div className="state-block__actions">
        <Link to="/" className="mc-btn mc-btn--primary">
          Retour à l&rsquo;accueil
        </Link>
        <Link to="/connexion" className="mc-btn mc-btn--outline">
          Se connecter
        </Link>
      </div>
    </ErrorLayout>
  )
}
