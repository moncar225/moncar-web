import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { sessionManager } from '../src/api/client'
import { createAppRoutes } from '../src/app/router/routes'
import { POSTES } from '../src/domain/permissions'
import type { Poste } from '../src/domain/types'
import type { Role, SessionUser } from '../src/types/auth'

/** Session de test pour un poste, avec les permissions du référentiel. */
export function sessionPour(poste: Poste, extra: Partial<SessionUser> = {}): SessionUser {
  const def = POSTES[poste]
  const role: Role = def.espace === 'terrain' ? 'compagnie' : def.espace
  return {
    id: `u-test-${poste}`,
    fullName: `Test ${def.libelle}`,
    roles: [role],
    poste,
    posteLibelle: def.libelle,
    permissions: def.permissions,
    compagnie: role === 'compagnie' ? { id: 'c-lagune', nom: 'Lagune Express (démo)' } : null,
    gare: null,
    fournisseur: role === 'business' ? { id: 'f-agence', nom: 'Agence Location Abidjan (démo)', vtc: false } : null,
    motDePasseTemporaire: false,
    ...extra,
  }
}

/** Rend l'application (routeur mémoire) à un chemin donné. */
export function renderAt(path: string, initialSession?: SessionUser | null) {
  const router = createMemoryRouter(createAppRoutes({ initialSession }), { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

/**
 * Session réelle sur le faux backend : jeton reconnu par MSW + utilisateur
 * de session correspondant (comptes du jeu de démo, ex. `u-dg`, `u-adm`).
 */
export function connecte(compteId: string, poste: Poste, extra: Partial<SessionUser> = {}): SessionUser {
  sessionManager.set({ token: `demo.${compteId}.test`, expiresAt: Date.now() + 3_600_000, userId: compteId })
  return sessionPour(poste, { id: compteId, ...extra })
}
