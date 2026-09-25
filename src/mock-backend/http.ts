/**
 * ⚠️ FAUX BACKEND — outils communs des handlers MSW : format d'erreur unique
 * (§11.2 : code métier stable + message français + champs fautifs),
 * authentification par jeton, permissions, isolation par entité, audit.
 */
import { HttpResponse } from 'msw'
import { POSTES, type Permission } from '@/domain/permissions'
import type { Compte } from '@/domain/types'
import { db, nouvelId, sauvegarder } from './db'

/** Préfixe des chemins d'API (base `…/api/v1`). */
export const API = '*/api/v1'

export interface ErreurChamp {
  field: string
  message: string
}

export function erreur(status: number, code: string, message: string, errors?: ErreurChamp[]) {
  return HttpResponse.json({ code, message, errors }, { status })
}

export function ok<T>(data: T, status = 200) {
  sauvegarder()
  return HttpResponse.json(data as unknown as Record<string, unknown>, { status })
}

export function jetonPour(compteId: string): string {
  return `demo.${compteId}.${Math.random().toString(36).slice(2)}`
}

/** Compte de la requête (jeton `Bearer demo.<compteId>.<aléa>`), ou `null`. */
export function compteDe(request: Request): Compte | null {
  const header = request.headers.get('Authorization') ?? ''
  const match = /^Bearer demo\.([^.]+)\./.exec(header)
  if (match === null) return null
  const compte = db().comptes.find((c) => c.id === match[1])
  if (compte === undefined || compte.statut !== 'actif') return null
  return compte
}

export function permissionsDe(compte: Compte): Permission[] {
  return POSTES[compte.poste].permissions
}

type Garde = { compte: Compte; refus: null } | { compte: null; refus: Response }

/** Vérifie la session et, si fourni, la permission requise (401 / 403). */
export function exiger(request: Request, permission?: Permission): Garde {
  const compte = compteDe(request)
  if (compte === null) {
    return { compte: null, refus: erreur(401, 'SESSION_INVALIDE', 'Votre session a expiré. Veuillez vous reconnecter.') }
  }
  if (permission !== undefined && !permissionsDe(compte).includes(permission)) {
    return {
      compte: null,
      refus: erreur(403, 'PERMISSION_REFUSEE', 'Accès interdit. Vous ne pouvez pas effectuer cette action.'),
    }
  }
  return { compte, refus: null }
}

/** Isolation : un compte compagnie ne voit que sa compagnie ; PROSOFT voit tout. */
export function visibleParCompagnie(compte: Compte, compagnieId: string | undefined): boolean {
  if (compte.espace === 'admin') return true
  return compte.compagnieId !== undefined && compte.compagnieId === compagnieId
}

export function nomComplet(compte: Compte): string {
  return `${compte.prenom} ${compte.nom}`
}

/** Journal d'audit en écriture seule (auteur, heure, avant/après). */
export function auditer(
  compte: Compte,
  action: string,
  entite: string,
  entiteId: string,
  avant?: unknown,
  apres?: unknown,
): void {
  db().audit.unshift({
    id: nouvelId('au'),
    date: new Date().toISOString(),
    auteur: nomComplet(compte),
    poste: compte.poste,
    action,
    entite,
    entiteId,
    avant,
    apres,
    compagnieId: compte.compagnieId,
  })
}

export async function corps<T>(request: Request): Promise<T> {
  return (await request.json()) as T
}

/** Champs obligatoires manquants → liste d'erreurs 422. */
export function champsManquants(body: Record<string, unknown>, champs: Record<string, string>): ErreurChamp[] {
  return Object.entries(champs)
    .filter(([cle]) => {
      const v = body[cle]
      return v === undefined || v === null || (typeof v === 'string' && v.trim() === '')
    })
    .map(([field, libelle]) => ({ field, message: `${libelle} est obligatoire.` }))
}
