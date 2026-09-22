export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  GONE: 410,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NETWORK_ERROR: -1,
} as const;

export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

export const API_ERROR_MESSAGES: Readonly<Record<number, string>> = {
  [HTTP_STATUS.BAD_REQUEST]:
    'Requête invalide. Vérifiez les informations saisies.',
  [HTTP_STATUS.UNAUTHORIZED]:
    'Votre session a expiré. Veuillez vous reconnecter.',
  [HTTP_STATUS.FORBIDDEN]:
    'Accès interdit. Vous ne pouvez pas effectuer cette action.',
  [HTTP_STATUS.NOT_FOUND]: 'Ressource introuvable.',
  [HTTP_STATUS.CONFLICT]:
    'Conflit : les données ont changé entre-temps. Rechargez les données puis réessayez.',
  [HTTP_STATUS.GONE]:
    'Cette ressource n’est plus disponible. Actualisez la page.',
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]:
    'Les données envoyées sont invalides. Vérifiez les champs signalés.',
  [HTTP_STATUS.TOO_MANY_REQUESTS]:
    'Trop de requêtes. Veuillez patienter un instant avant de réessayer.',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]:
    'Une erreur est survenue côté serveur. Veuillez réessayer plus tard.',
  [HTTP_STATUS.NETWORK_ERROR]:
    'Connexion impossible. Vérifiez votre connexion internet puis réessayez.',
} as const;

export function messageForStatusCode(
  statusCode: number,
  fallback?: string,
): string {
  const generic = API_ERROR_MESSAGES[statusCode];
  if (generic !== undefined) return generic;
  return (
    fallback ?? 'Une erreur inattendue est survenue. Veuillez réessayer.'
  );
}

export type ErrorKind =
  | 'validation'
  | 'auth'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'gone'
  | 'tooManyRequests'
  | 'server'
  | 'network'
  | 'unknown';

export function classifyError(statusCode: number): ErrorKind {
  switch (statusCode) {
    case HTTP_STATUS.UNPROCESSABLE_ENTITY:
    case HTTP_STATUS.BAD_REQUEST:
      return 'validation';
    case HTTP_STATUS.UNAUTHORIZED:
      return 'auth';
    case HTTP_STATUS.FORBIDDEN:
      return 'forbidden';
    case HTTP_STATUS.NOT_FOUND:
      return 'notFound';
    case HTTP_STATUS.CONFLICT:
      return 'conflict';
    case HTTP_STATUS.GONE:
      return 'gone';
    case HTTP_STATUS.TOO_MANY_REQUESTS:
      return 'tooManyRequests';
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      return 'server';
    case HTTP_STATUS.NETWORK_ERROR:
      return 'network';
    default:
      return statusCode >= 500 ? 'server' : 'unknown';
  }
}
