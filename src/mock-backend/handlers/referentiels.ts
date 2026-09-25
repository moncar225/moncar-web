/**
 * ⚠️ FAUX BACKEND — référentiels, compagnies, gares, fournisseurs et comptes
 * (REF-001, AUTH-003 — roadmap §9.1 et §9.2).
 */
import { http, type HttpHandler } from 'msw'
import { POSTES } from '@/domain/permissions'
import type { Compagnie, Compte, Gare, StatutValidation } from '@/domain/types'
import { db, nouvelId } from '../db'
import { API, auditer, champsManquants, corps, erreur, exiger, ok, visibleParCompagnie } from '../http'

function motDePasseTemporaire(): string {
  return `Tmp${Math.floor(100000 + Math.random() * 900000)}`
}

export const referentielsHandlers: HttpHandler[] = [
  // ——— Villes et catégories ———
  http.get(`${API}/villes`, ({ request }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    return ok(db().villes)
  }),
  http.post(`${API}/villes`, async ({ request }) => {
    const g = exiger(request, 'admin.referentiels.gerer')
    if (g.refus !== null) return g.refus
    const body = await corps<{ nom?: string; region?: string }>(request)
    const manquants = champsManquants(body, { nom: 'Le nom', region: 'La région' })
    if (manquants.length > 0) return erreur(422, 'VALIDATION', 'Vérifiez les champs signalés.', manquants)
    if (db().villes.some((v) => v.nom.toLowerCase() === (body.nom ?? '').trim().toLowerCase())) {
      return erreur(409, 'VILLE_EXISTANTE', 'Cette ville existe déjà.')
    }
    const ville = { id: nouvelId('v'), nom: (body.nom ?? '').trim(), region: (body.region ?? '').trim() }
    db().villes.push(ville)
    auditer(g.compte, 'Création d’une ville', 'ville', ville.id, undefined, ville)
    return ok(ville, 201)
  }),
  http.get(`${API}/categories-vehicules`, ({ request }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    return ok(db().categories)
  }),
  http.post(`${API}/categories-vehicules`, async ({ request }) => {
    const g = exiger(request, 'admin.referentiels.gerer')
    if (g.refus !== null) return g.refus
    const body = await corps<{ nom?: string; usage?: 'transport' | 'location' }>(request)
    const manquants = champsManquants(body, { nom: 'Le nom', usage: 'L’usage' })
    if (manquants.length > 0) return erreur(422, 'VALIDATION', 'Vérifiez les champs signalés.', manquants)
    const cat = { id: nouvelId('cat'), nom: (body.nom ?? '').trim(), usage: body.usage ?? 'transport' }
    db().categories.push(cat)
    auditer(g.compte, 'Création d’une catégorie de véhicule', 'categorie_vehicule', cat.id, undefined, cat)
    return ok(cat, 201)
  }),

  // ——— Compagnies ———
  http.get(`${API}/compagnies`, ({ request }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    return ok(db().compagnies.filter((c) => visibleParCompagnie(g.compte, c.id)))
  }),
  http.get(`${API}/compagnies/:id`, ({ request, params }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const c = db().compagnies.find((x) => x.id === params.id)
    if (c === undefined || !visibleParCompagnie(g.compte, c.id)) return erreur(404, 'INTROUVABLE', 'Compagnie introuvable.')
    return ok(c)
  }),
  http.post(`${API}/compagnies`, async ({ request }) => {
    const g = exiger(request, 'admin.compagnies.valider')
    if (g.refus !== null) return g.refus
    const body = await corps<Partial<Compagnie>>(request)
    const manquants = champsManquants(body as Record<string, unknown>, {
      nom: 'Le nom',
      sigle: 'Le sigle',
      telephone: 'Le téléphone',
      email: 'L’e-mail',
      villeSiegeId: 'La ville du siège',
    })
    if (manquants.length > 0) return erreur(422, 'VALIDATION', 'Vérifiez les champs signalés.', manquants)
    const p = db().parametres
    const compagnie: Compagnie = {
      id: nouvelId('c'),
      nom: body.nom ?? '',
      sigle: (body.sigle ?? '').toUpperCase(),
      telephone: body.telephone ?? '',
      email: body.email ?? '',
      adresse: body.adresse ?? '',
      villeSiegeId: body.villeSiegeId ?? '',
      statut: 'en_attente',
      commissionPct: p.commissionVoyagePct,
      fraisOperation: p.fraisOperationVoyage,
      accepteColis: body.accepteColis ?? false,
      creeLe: new Date().toISOString(),
    }
    db().compagnies.push(compagnie)
    auditer(g.compte, 'Création d’une compagnie', 'compagnie', compagnie.id, undefined, compagnie)
    return ok(compagnie, 201)
  }),
  http.patch(`${API}/compagnies/:id`, async ({ request, params }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const c = db().compagnies.find((x) => x.id === params.id)
    if (c === undefined || !visibleParCompagnie(g.compte, c.id)) return erreur(404, 'INTROUVABLE', 'Compagnie introuvable.')
    const admin = g.compte.espace === 'admin'
    if (!admin && g.compte.poste !== 'dg') {
      return erreur(403, 'PERMISSION_REFUSEE', 'Accès interdit. Vous ne pouvez pas effectuer cette action.')
    }
    const body = await corps<Partial<Compagnie>>(request)
    const avant = { ...c }
    // Les paramètres financiers ne sont modifiables que par PROSOFT (⚠ A-4).
    const autorises: (keyof Compagnie)[] = admin
      ? ['nom', 'sigle', 'telephone', 'email', 'adresse', 'villeSiegeId', 'accepteColis', 'commissionPct', 'fraisOperation']
      : ['telephone', 'email', 'adresse', 'accepteColis']
    for (const cle of autorises) {
      if (body[cle] !== undefined) Object.assign(c, { [cle]: body[cle] })
    }
    auditer(g.compte, 'Modification d’une compagnie', 'compagnie', c.id, avant, { ...c })
    return ok(c)
  }),
  http.post(`${API}/compagnies/:id/validation`, async ({ request, params }) => {
    const g = exiger(request, 'admin.compagnies.valider')
    if (g.refus !== null) return g.refus
    const c = db().compagnies.find((x) => x.id === params.id)
    if (c === undefined) return erreur(404, 'INTROUVABLE', 'Compagnie introuvable.')
    const body = await corps<{ decision?: StatutValidation; motif?: string }>(request)
    if (body.decision === undefined || body.decision === 'en_attente') {
      return erreur(422, 'VALIDATION', 'Choisissez une décision.', [{ field: 'decision', message: 'Décision obligatoire.' }])
    }
    if (body.decision !== 'validee' && (body.motif ?? '').trim() === '') {
      return erreur(422, 'VALIDATION', 'Un motif est obligatoire pour un refus ou une suspension.', [
        { field: 'motif', message: 'Motif obligatoire.' },
      ])
    }
    const avant = { statut: c.statut }
    c.statut = body.decision
    c.motifDecision = body.motif
    auditer(g.compte, `Décision de validation : ${body.decision}`, 'compagnie', c.id, avant, { statut: c.statut, motif: body.motif })
    return ok(c)
  }),

  // ——— Gares ———
  http.get(`${API}/gares`, ({ request }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const compagnieId = new URL(request.url).searchParams.get('compagnieId') ?? undefined
    return ok(
      db().gares.filter(
        (x) => visibleParCompagnie(g.compte, x.compagnieId) && (compagnieId === undefined || x.compagnieId === compagnieId),
      ),
    )
  }),
  http.post(`${API}/gares`, async ({ request }) => {
    const g = exiger(request, 'personnel.gerer')
    if (g.refus !== null) return g.refus
    const body = await corps<Partial<Gare>>(request)
    const manquants = champsManquants(body as Record<string, unknown>, { nom: 'Le nom', villeId: 'La ville', adresse: 'L’adresse' })
    if (manquants.length > 0) return erreur(422, 'VALIDATION', 'Vérifiez les champs signalés.', manquants)
    const gare: Gare = {
      id: nouvelId('g'),
      compagnieId: g.compte.compagnieId ?? '',
      nom: body.nom ?? '',
      villeId: body.villeId ?? '',
      adresse: body.adresse ?? '',
      lat: Number(body.lat ?? 0),
      lng: Number(body.lng ?? 0),
      horaires: body.horaires ?? '05:00 – 21:00',
      active: true,
    }
    db().gares.push(gare)
    auditer(g.compte, 'Création d’une gare', 'gare', gare.id, undefined, gare)
    return ok(gare, 201)
  }),
  http.patch(`${API}/gares/:id`, async ({ request, params }) => {
    const g = exiger(request, 'personnel.gerer')
    if (g.refus !== null) return g.refus
    const gare = db().gares.find((x) => x.id === params.id)
    if (gare === undefined || !visibleParCompagnie(g.compte, gare.compagnieId)) return erreur(404, 'INTROUVABLE', 'Gare introuvable.')
    const body = await corps<Partial<Gare>>(request)
    const avant = { ...gare }
    for (const cle of ['nom', 'villeId', 'adresse', 'lat', 'lng', 'horaires', 'active'] as const) {
      if (body[cle] !== undefined) Object.assign(gare, { [cle]: body[cle] })
    }
    auditer(g.compte, 'Modification d’une gare', 'gare', gare.id, avant, { ...gare })
    return ok(gare)
  }),

  // ——— Fournisseurs BUSINESS (validation PROSOFT) ———
  http.get(`${API}/fournisseurs`, ({ request }) => {
    const g = exiger(request, 'admin.compagnies.valider')
    if (g.refus !== null) return g.refus
    return ok(db().fournisseurs)
  }),
  http.post(`${API}/fournisseurs/:id/validation`, async ({ request, params }) => {
    const g = exiger(request, 'admin.compagnies.valider')
    if (g.refus !== null) return g.refus
    const f = db().fournisseurs.find((x) => x.id === params.id)
    if (f === undefined) return erreur(404, 'INTROUVABLE', 'Fournisseur introuvable.')
    const body = await corps<{ decision?: StatutValidation; motif?: string }>(request)
    if (body.decision === undefined || body.decision === 'en_attente') {
      return erreur(422, 'VALIDATION', 'Choisissez une décision.', [{ field: 'decision', message: 'Décision obligatoire.' }])
    }
    if (body.decision !== 'validee' && (body.motif ?? '').trim() === '') {
      return erreur(422, 'VALIDATION', 'Un motif est obligatoire pour un refus ou une suspension.', [
        { field: 'motif', message: 'Motif obligatoire.' },
      ])
    }
    const avant = { statut: f.statut }
    f.statut = body.decision
    auditer(g.compte, `Décision de validation : ${body.decision}`, 'fournisseur', f.id, avant, { statut: f.statut, motif: body.motif })
    return ok(f)
  }),

  // ——— Comptes (personnel compagnie / comptes plateforme) ———
  http.get(`${API}/utilisateurs`, ({ request }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const perms = POSTES[g.compte.poste].permissions
    if (!perms.includes('personnel.gerer') && !perms.includes('admin.comptes.gerer') && !perms.includes('planning.gerer')) {
      return erreur(403, 'PERMISSION_REFUSEE', 'Accès interdit. Vous ne pouvez pas effectuer cette action.')
    }
    return ok(db().comptes.filter((c) => (g.compte.espace === 'admin' ? true : c.compagnieId === g.compte.compagnieId)))
  }),
  http.post(`${API}/utilisateurs`, async ({ request }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const admin = g.compte.espace === 'admin'
    const perm = admin ? 'admin.comptes.gerer' : 'personnel.gerer'
    if (!POSTES[g.compte.poste].permissions.includes(perm)) {
      return erreur(403, 'PERMISSION_REFUSEE', 'Accès interdit. Vous ne pouvez pas effectuer cette action.')
    }
    const body = await corps<Partial<Compte>>(request)
    const manquants = champsManquants(body as Record<string, unknown>, {
      prenom: 'Le prénom',
      nom: 'Le nom',
      telephone: 'Le téléphone',
      poste: 'Le poste',
    })
    if (manquants.length > 0) return erreur(422, 'VALIDATION', 'Vérifiez les champs signalés.', manquants)
    const poste = body.poste as Compte['poste']
    const espacePoste = POSTES[poste]?.espace
    // Une compagnie ne crée que ses propres postes ; PROSOFT ne crée que les siens.
    if (espacePoste === undefined || (!admin && espacePoste !== 'compagnie' && espacePoste !== 'terrain') || (admin && espacePoste !== 'admin')) {
      return erreur(422, 'POSTE_INVALIDE', 'Ce poste ne peut pas être attribué ici.', [{ field: 'poste', message: 'Poste non autorisé.' }])
    }
    const telephone = (body.telephone ?? '').replaceAll(' ', '')
    if (db().comptes.some((c) => c.telephone === telephone)) {
      return erreur(409, 'TELEPHONE_EXISTANT', 'Un compte existe déjà avec ce numéro.', [{ field: 'telephone', message: 'Numéro déjà utilisé.' }])
    }
    const compte: Compte = {
      id: nouvelId('u'),
      prenom: body.prenom ?? '',
      nom: body.nom ?? '',
      telephone,
      email: body.email ?? '',
      espace: admin ? 'admin' : 'compagnie',
      poste,
      compagnieId: admin ? undefined : g.compte.compagnieId,
      gareId: body.gareId,
      statut: 'actif',
      motDePasseTemporaire: true,
      a2f: poste === 'dg' || poste === 'finance' || admin,
      creeLe: new Date().toISOString(),
    }
    const temporaire = motDePasseTemporaire()
    db().comptes.push(compte)
    db().motsDePasse[compte.id] = temporaire
    auditer(g.compte, 'Création d’un compte agent', 'utilisateur', compte.id, undefined, { poste, telephone })
    return ok({ compte, motDePasseTemporaire: temporaire }, 201)
  }),
  http.patch(`${API}/utilisateurs/:id`, async ({ request, params }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const cible = db().comptes.find((c) => c.id === params.id)
    const admin = g.compte.espace === 'admin'
    if (cible === undefined || (!admin && cible.compagnieId !== g.compte.compagnieId)) {
      return erreur(404, 'INTROUVABLE', 'Compte introuvable.')
    }
    if (!POSTES[g.compte.poste].permissions.includes(admin ? 'admin.comptes.gerer' : 'personnel.gerer')) {
      return erreur(403, 'PERMISSION_REFUSEE', 'Accès interdit. Vous ne pouvez pas effectuer cette action.')
    }
    if (cible.id === g.compte.id) return erreur(409, 'PROPRE_COMPTE', 'Vous ne pouvez pas modifier votre propre compte ici.')
    const body = await corps<Partial<Compte>>(request)
    const avant = { statut: cible.statut, poste: cible.poste, gareId: cible.gareId }
    if (body.statut !== undefined) cible.statut = body.statut
    if (body.gareId !== undefined) cible.gareId = body.gareId
    if (body.poste !== undefined) cible.poste = body.poste
    auditer(g.compte, 'Modification d’un compte agent', 'utilisateur', cible.id, avant, {
      statut: cible.statut,
      poste: cible.poste,
      gareId: cible.gareId,
    })
    return ok(cible)
  }),
  http.post(`${API}/utilisateurs/:id/reinitialisation`, ({ request, params }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const cible = db().comptes.find((c) => c.id === params.id)
    const admin = g.compte.espace === 'admin'
    if (cible === undefined || (!admin && cible.compagnieId !== g.compte.compagnieId)) {
      return erreur(404, 'INTROUVABLE', 'Compte introuvable.')
    }
    if (!POSTES[g.compte.poste].permissions.includes(admin ? 'admin.comptes.gerer' : 'personnel.gerer')) {
      return erreur(403, 'PERMISSION_REFUSEE', 'Accès interdit. Vous ne pouvez pas effectuer cette action.')
    }
    const temporaire = motDePasseTemporaire()
    db().motsDePasse[cible.id] = temporaire
    cible.motDePasseTemporaire = true
    auditer(g.compte, 'Réinitialisation du mot de passe', 'utilisateur', cible.id)
    return ok({ motDePasseTemporaire: temporaire })
  }),
]
