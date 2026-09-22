import { Spinner } from './ui'

interface PageLoaderProps {
  /** Libellé annoncé aux lecteurs d'écran (fallback Suspense, états loading). */
  label?: string
}

/** Fallback de chargement commun (Suspense, guards, requêtes). */
export function PageLoader({ label = 'Chargement…' }: PageLoaderProps) {
  return (
    <div className="page-loader">
      <Spinner size="lg" label={label} />
      <p>{label}</p>
    </div>
  )
}
