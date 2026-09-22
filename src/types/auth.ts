/** Rôles MON CAR — un rôle par espace web protégé. */
export type Role = 'compagnie' | 'business' | 'admin'

/** Utilisateur authentifié (shape minimale ; sera alignée sur le contrat OpenAPI). */
export interface SessionUser {
  id: string
  fullName: string
  roles: ReadonlyArray<Role>
}

/** États du cycle d'authentification partagés par tous les guards. */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'
