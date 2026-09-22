import { Link } from 'react-router-dom'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/** Page 404 — ressource introuvable. */
export function NotFoundPage() {
  useDocumentTitle('MON CAR — Page introuvable')
  return (
    <section className="state-block" aria-labelledby="not-found-title">
      <p className="state-block__code">Erreur 404</p>
      <h1 id="not-found-title">Page introuvable</h1>
      <p>La page demandée n&rsquo;existe pas ou a été déplacée.</p>
      <Link to="/">Retour à l&rsquo;accueil</Link>
    </section>
  )
}
