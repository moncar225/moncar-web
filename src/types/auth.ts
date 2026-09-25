import type { Permission } from '@/domain/permissions'
import type { Poste } from '@/domain/types'

/** Rôles MON CAR — un rôle par espace web protégé. */
export type Role = 'compagnie' | 'business' | 'admin'

export interface EntiteRef {
  id: string
  nom: string
}

/** Utilisateur authentifié (profil `GET /me` + permissions `GET /me/capacites`). */
export interface SessionUser {
  id: string
  fullName: string
  roles: ReadonlyArray<Role>
  poste?: Poste
  posteLibelle?: string
  /** Permissions renvoyées par le serveur — jamais codées en dur dans l'UI. */
  permissions?: ReadonlyArray<Permission>
  compagnie?: EntiteRef | null
  gare?: EntiteRef | null
  fournisseur?: (EntiteRef & { vtc: boolean }) | null
  motDePasseTemporaire?: boolean
}

/** États du cycle d'authentification partagés par tous les guards. */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'
