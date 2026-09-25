/**
 * Authentification des postes web (AUTH-002/003 — roadmap §9.1).
 * Chemins de la roadmap ; en attendant l'API, le faux backend MSW répond.
 */
import { httpClient } from '@/api/client'
import type { StoredSession } from '@/api/client/session'
import type { Permission } from '@/domain/permissions'
import type { Espace, Poste } from '@/domain/types'
import type { SessionUser } from '@/types/auth'

export type ReponseConnexion =
  | ({ etape: 'connecte'; motDePasseTemporaire: boolean } & StoredSession)
  | { etape: 'a2f'; defi: string; destination: string }

export interface Profil {
  id: string
  prenom: string
  nom: string
  telephone: string
  email: string
  espace: Espace
  poste: Poste
  posteLibelle: string
  motDePasseTemporaire: boolean
  compagnie: { id: string; nom: string } | null
  gare: { id: string; nom: string } | null
  fournisseur: { id: string; nom: string; vtc: boolean } | null
}

/** POST /auth/connexion-pro — identifiant (téléphone ou e-mail) + mot de passe. */
export function connexion(identifiant: string, motDePasse: string): Promise<ReponseConnexion> {
  return httpClient.post<ReponseConnexion>('/auth/connexion-pro', {
    body: { identifiant, motDePasse },
    skipAuth: true,
    skipIdempotency: true,
  })
}

/** POST /auth/otp/verification — double authentification des rôles sensibles. */
export function verifierA2f(defi: string, code: string): Promise<ReponseConnexion> {
  return httpClient.post<ReponseConnexion>('/auth/otp/verification', {
    body: { defi, code },
    skipAuth: true,
    skipIdempotency: true,
  })
}

/** GET /me + GET /me/capacites → utilisateur de session. */
export async function chargerSession(): Promise<SessionUser> {
  const [profil, capacites] = await Promise.all([
    httpClient.get<Profil>('/me'),
    httpClient.get<{ permissions: Permission[] }>('/me/capacites'),
  ])
  return {
    id: profil.id,
    fullName: `${profil.prenom} ${profil.nom}`,
    roles: [profil.espace],
    poste: profil.poste,
    posteLibelle: profil.posteLibelle,
    permissions: capacites.permissions,
    compagnie: profil.compagnie,
    gare: profil.gare,
    fournisseur: profil.fournisseur,
    motDePasseTemporaire: profil.motDePasseTemporaire,
  }
}

/** POST /auth/mot-de-passe/temporaire — changement obligatoire à la 1re connexion. */
export function changerMotDePasseTemporaire(nouveauMotDePasse: string): Promise<{ ok: true }> {
  return httpClient.post('/auth/mot-de-passe/temporaire', { body: { nouveauMotDePasse } })
}

/** POST /auth/deconnexion — révocation côté serveur (erreurs ignorées). */
export async function deconnexion(): Promise<void> {
  try {
    await httpClient.post('/auth/deconnexion', { skipIdempotency: true })
  } catch {
    // la session locale est effacée quoi qu'il arrive
  }
}

/** Espace d'accueil selon le rôle de la session. */
export function espaceAccueil(user: SessionUser): string {
  const role = user.roles[0]
  if (role === 'admin') return '/admin'
  if (role === 'business') return '/business'
  return '/compagnie'
}
