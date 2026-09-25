/**
 * ⚠️ FAUX BACKEND — authentification des postes web (AUTH-002/003).
 * Chemins de la roadmap §9.1. Code de double authentification de démo : 123456.
 */
import { http, HttpResponse, type HttpHandler } from 'msw'
import { exigeA2f, POSTES } from '@/domain/permissions'
import type { Compte } from '@/domain/types'
import { db, reinitialiserDb } from '../db'
import { API, auditer, corps, erreur, exiger, jetonPour, ok, permissionsDe } from '../http'

export const CODE_A2F_DEMO = '123456'
const DUREE_SESSION_MS = 8 * 60 * 60 * 1000

/** Défis A2F en cours : jeton de défi → compte. */
const defis = new Map<string, string>()

function session(compte: Compte) {
  compte.derniereConnexion = new Date().toISOString()
  return {
    etape: 'connecte' as const,
    token: jetonPour(compte.id),
    expiresAt: Date.now() + DUREE_SESSION_MS,
    userId: compte.id,
    motDePasseTemporaire: compte.motDePasseTemporaire,
  }
}

export function profilDe(compte: Compte) {
  const d = db()
  const compagnie = d.compagnies.find((c) => c.id === compte.compagnieId)
  const gare = d.gares.find((g) => g.id === compte.gareId)
  const fournisseur = d.fournisseurs.find((f) => f.id === compte.fournisseurId)
  return {
    id: compte.id,
    prenom: compte.prenom,
    nom: compte.nom,
    telephone: compte.telephone,
    email: compte.email,
    espace: compte.espace,
    poste: compte.poste,
    posteLibelle: POSTES[compte.poste].libelle,
    motDePasseTemporaire: compte.motDePasseTemporaire,
    compagnie: compagnie === undefined ? null : { id: compagnie.id, nom: compagnie.nom },
    gare: gare === undefined ? null : { id: gare.id, nom: gare.nom },
    fournisseur: fournisseur === undefined ? null : { id: fournisseur.id, nom: fournisseur.nom, vtc: fournisseur.vtc },
  }
}

export const authHandlers: HttpHandler[] = [
  http.post(`${API}/auth/connexion-pro`, async ({ request }) => {
    const body = await corps<{ identifiant?: string; motDePasse?: string }>(request)
    const identifiant = (body.identifiant ?? '').trim().toLowerCase().replaceAll(' ', '')
    const compte = db().comptes.find(
      (c) => c.email.toLowerCase() === identifiant || c.telephone === identifiant.replace(/^\+225/, ''),
    )
    if (compte === undefined || db().motsDePasse[compte.id] !== body.motDePasse) {
      return erreur(401, 'IDENTIFIANTS_INVALIDES', 'Identifiant ou mot de passe incorrect.')
    }
    if (compte.statut !== 'actif') {
      return erreur(403, 'COMPTE_SUSPENDU', 'Ce compte est suspendu. Contactez votre administrateur.')
    }
    if (POSTES[compte.poste].espace === 'terrain') {
      return erreur(403, 'POSTE_MOBILE', 'Ce poste s’utilise dans l’application MON CAR PRO, pas sur le web.')
    }
    if (compte.a2f || exigeA2f(compte.poste)) {
      const defi = `a2f.${compte.id}.${Math.random().toString(36).slice(2)}`
      defis.set(defi, compte.id)
      return ok({ etape: 'a2f' as const, defi, destination: `•••• ${compte.telephone.slice(-2)}` })
    }
    return ok(session(compte))
  }),

  http.post(`${API}/auth/otp/verification`, async ({ request }) => {
    const body = await corps<{ defi?: string; code?: string }>(request)
    const compteId = body.defi === undefined ? undefined : defis.get(body.defi)
    const compte = db().comptes.find((c) => c.id === compteId)
    if (compte === undefined) return erreur(410, 'DEFI_EXPIRE', 'Le code a expiré. Reconnectez-vous.')
    if (body.code !== CODE_A2F_DEMO) {
      return erreur(422, 'CODE_INVALIDE', 'Code incorrect.', [{ field: 'code', message: 'Code incorrect.' }])
    }
    defis.delete(body.defi as string)
    return ok(session(compte))
  }),

  http.get(`${API}/me`, ({ request }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    return ok(profilDe(g.compte))
  }),

  http.get(`${API}/me/capacites`, ({ request }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    return ok({ permissions: permissionsDe(g.compte) })
  }),

  http.post(`${API}/auth/mot-de-passe/temporaire`, async ({ request }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const body = await corps<{ nouveauMotDePasse?: string }>(request)
    const mdp = body.nouveauMotDePasse ?? ''
    if (mdp.length < 8 || !/[0-9]/.test(mdp) || !/[A-Za-z]/.test(mdp)) {
      return erreur(422, 'MOT_DE_PASSE_FAIBLE', 'Le mot de passe ne respecte pas les règles.', [
        { field: 'nouveauMotDePasse', message: '8 caractères minimum, avec des lettres et des chiffres.' },
      ])
    }
    db().motsDePasse[g.compte.id] = mdp
    g.compte.motDePasseTemporaire = false
    auditer(g.compte, 'Changement du mot de passe temporaire', 'utilisateur', g.compte.id)
    return ok({ ok: true })
  }),

  http.post(`${API}/auth/deconnexion`, () => new HttpResponse(null, { status: 204 })),

  // Outil de démonstration uniquement (n'existe pas dans l'API réelle).
  http.post(`${API}/demo/reinitialisation`, () => {
    reinitialiserDb()
    return ok({ ok: true })
  }),
]
