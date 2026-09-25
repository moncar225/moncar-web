import type { RootOptions } from 'react-dom/client'
import { env } from './env'

/**
 * Supervision des erreurs (Sentry). Désactivée si aucun DSN n'est fourni
 * (poste de dev, tests) ; le SDK n'est alors même pas téléchargé (import
 * dynamique). Renvoie les options de `createRoot` qui remontent les erreurs
 * React à Sentry.
 */
export async function initMonitoring(): Promise<RootOptions> {
  if (env.sentryDsn === '') return {}
  const Sentry = await import('@sentry/react')
  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.appEnv,
    // Minimum de données : ni identité, ni cookies, ni en-têtes (jetons),
    // ni corps ou paramètres d'URL (numéros de téléphone, billets…).
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
  })
  Sentry.setTag('app', 'web')
  return {
    onUncaughtError: Sentry.reactErrorHandler(),
    onCaughtError: Sentry.reactErrorHandler(),
    onRecoverableError: Sentry.reactErrorHandler(),
  }
}
