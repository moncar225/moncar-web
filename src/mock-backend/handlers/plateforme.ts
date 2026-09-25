/**
 * ⚠️ FAUX BACKEND — finances (PAY-002), tableaux de bord, paramètres
 * plateforme, promotions (PRO-001), fidélité (FID-001), litiges (AUD-002),
 * journal d'audit (AUD-001) — roadmap §9.5 et §9.8.
 */
import { http, type HttpHandler } from 'msw'
import type { Compte, Litige, ParametresPlateforme, ProgrammeFidelite, Promotion } from '@/domain/types'
import { db, nouvelId, prochainNumero } from '../db'
import { reservationActive } from '../metier'
import { numerosSieges } from '../seed'
import { API, auditer, champsManquants, corps, erreur, exiger, nomComplet, ok, permissionsDe } from '../http'

function jour(iso: string): string {
  return iso.slice(0, 10)
}

function compagnieDe(compte: Compte): string | undefined {
  return compte.espace === 'admin' ? undefined : compte.compagnieId
}

/** Propriétaire d'un contenu (promotion, litige) selon l'espace du compte. */
function auteurDe(compte: Compte): { type: 'compagnie' | 'fournisseur'; id: string; nom: string } | null {
  if (compte.espace === 'compagnie' && compte.compagnieId !== undefined) {
    return { type: 'compagnie', id: compte.compagnieId, nom: db().compagnies.find((c) => c.id === compte.compagnieId)?.nom ?? '' }
  }
  if (compte.espace === 'business' && compte.fournisseurId !== undefined) {
    return { type: 'fournisseur', id: compte.fournisseurId, nom: db().fournisseurs.find((f) => f.id === compte.fournisseurId)?.nom ?? '' }
  }
  return null
}

export const plateformeHandlers: HttpHandler[] = [
  // ——— Tableaux de bord ———
  http.get(`${API}/tableau-de-bord`, ({ request }) => {
    const g = exiger(request, 'tableau.consulter')
    if (g.refus !== null) return g.refus
    const cid = g.compte.compagnieId
    const auj = new Date().toISOString().slice(0, 10)
    const voyages = db().voyages.filter((v) => v.compagnieId === cid)
    const duJour = voyages.filter((v) => jour(v.depart) === auj)
    const ids = new Set(voyages.map((v) => v.id))
    const ventesJour = db().reservations.filter((r) => ids.has(r.voyageId) && reservationActive(r) && jour(r.creeLe) === auj)
    const remplissage = duJour.map((v) => {
      const veh = db().vehicules.find((x) => x.id === v.vehiculeId)
      const places = veh === undefined ? 0 : numerosSieges(veh.plan).length
      const vendus = db().reservations.filter((r) => r.voyageId === v.id && reservationActive(r)).length
      return places === 0 ? 0 : vendus / places
    })
    const serie = Array.from({ length: 14 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - 13 + i)
      const j = d.toISOString().slice(0, 10)
      const ventes = db().reservations.filter((r) => ids.has(r.voyageId) && reservationActive(r) && jour(r.creeLe) === j)
      return { jour: j, app: ventes.filter((r) => r.canal === 'app').reduce((s, r) => s + r.montant, 0), guichet: ventes.filter((r) => r.canal === 'guichet').reduce((s, r) => s + r.montant, 0) }
    })
    const alertes: string[] = []
    const bientot = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    for (const v of db().vehicules.filter((x) => x.compagnieId === cid)) {
      if (v.etat === 'maintenance') alertes.push(`Véhicule ${v.immatriculation} en maintenance.`)
      else if (v.prochaineMaintenance !== undefined && v.prochaineMaintenance <= bientot) alertes.push(`Maintenance du ${v.immatriculation} prévue le ${v.prochaineMaintenance}.`)
    }
    const sansAffectation = voyages.filter((v) => v.statut === 'programme' && (v.vehiculeId === undefined || v.chauffeurId === undefined) && new Date(v.depart).getTime() < Date.now() + 3 * 86400000)
    if (sansAffectation.length > 0) alertes.push(`${sansAffectation.length} voyage(s) des 3 prochains jours sans véhicule ou chauffeur.`)
    for (const s of db().sessionsCaisse.filter((x) => x.ecart !== undefined && x.ecart !== 0)) {
      alertes.push(`Écart de caisse de ${s.ecart ?? 0} F à la clôture du ${jour(s.cloture ?? s.ouverture)}.`)
    }
    return ok({
      voyagesDuJour: duJour.length,
      enRoute: duJour.filter((v) => v.statut === 'en_route').length,
      billetsDuJour: ventesJour.length,
      recettesDuJour: ventesJour.reduce((s, r) => s + r.montant, 0),
      remplissageMoyen: remplissage.length === 0 ? 0 : remplissage.reduce((s, x) => s + x, 0) / remplissage.length,
      colisEnCours: db().colis.filter((c) => c.compagnieId === cid && c.statut !== 'remis').length,
      caissesOuvertes: db().sessionsCaisse.filter((s) => s.statut === 'ouverte').length,
      serie,
      alertes,
      prochainsDeparts: duJour
        .filter((v) => v.statut === 'programme' || v.statut === 'embarquement')
        .sort((a, b) => a.depart.localeCompare(b.depart))
        .slice(0, 6)
        .map((v) => ({ id: v.id, depart: v.depart, reference: v.reference, ligne: db().lignes.find((l) => l.id === v.ligneId)?.nom ?? '', statut: v.statut })),
    })
  }),
  http.get(`${API}/admin/tableau-de-bord`, ({ request }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    if (g.compte.espace !== 'admin') return erreur(403, 'PERMISSION_REFUSEE', 'Accès interdit.')
    const d = db()
    const ventes = d.reservations.filter(reservationActive)
    const commissions = d.ecritures.filter((e) => e.journal === 'commission').reduce((s, e) => s + e.montant, 0)
    return ok({
      compagniesValidees: d.compagnies.filter((c) => c.statut === 'validee').length,
      dossiersEnAttente: d.compagnies.filter((c) => c.statut === 'en_attente').length + d.fournisseurs.filter((f) => f.statut === 'en_attente').length,
      fournisseurs: d.fournisseurs.filter((f) => f.statut === 'validee').length,
      billetsVendus: ventes.length,
      volumeVentes: ventes.reduce((s, r) => s + r.montant, 0),
      commissions,
      litigesOuverts: d.litiges.filter((l) => l.statut === 'ouvert' || l.statut === 'en_cours').length,
      promotionsAValider: d.promotions.filter((p) => p.statut === 'soumise').length,
      ecartsRapprochement: d.rapprochements.filter((r) => r.statut === 'ecart').length,
    })
  }),

  // ——— Finances ———
  http.get(`${API}/finances/ecritures`, ({ request }) => {
    const g = exiger(request, 'finances.consulter')
    if (g.refus !== null) return g.refus
    const q = new URL(request.url).searchParams
    const du = q.get('du') ?? '0000'
    const au = q.get('au') ?? '9999'
    const journal = q.get('journal')
    const cid = compagnieDe(g.compte)
    return ok(
      db()
        .ecritures.filter((e) => (cid === undefined || e.compagnieId === cid) && jour(e.date) >= du && jour(e.date) <= au && (journal === null || e.journal === journal))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 500),
    )
  }),
  http.get(`${API}/finances/synthese`, ({ request }) => {
    const g = exiger(request, 'finances.consulter')
    if (g.refus !== null) return g.refus
    const cid = compagnieDe(g.compte)
    const e = db().ecritures.filter((x) => cid === undefined || x.compagnieId === cid)
    const somme = (f: (x: (typeof e)[number]) => boolean) => e.filter(f).reduce((s, x) => s + x.montant, 0)
    const ventesApp = somme((x) => x.journal === 'vente')
    const ventesGuichet = somme((x) => x.journal === 'caisse')
    const commissions = somme((x) => x.journal === 'commission')
    const remboursements = somme((x) => x.journal === 'remboursement')
    const reverse = db().reversements.filter((r) => (cid === undefined || r.compagnieId === cid) && r.statut === 'paye').reduce((s, r) => s + r.montantNet, 0)
    return ok({
      ventesApp,
      ventesGuichet,
      commissions,
      remboursements,
      // Solde calculé depuis les écritures, jamais saisi (principe n°5).
      soldeDuParMonCar: ventesApp - commissions - remboursements - reverse,
      dejaReverse: reverse,
    })
  }),
  http.get(`${API}/finances/reversements`, ({ request }) => {
    const g = exiger(request, 'finances.consulter')
    if (g.refus !== null) return g.refus
    const cid = compagnieDe(g.compte)
    return ok(db().reversements.filter((r) => cid === undefined || r.compagnieId === cid))
  }),
  http.get(`${API}/finances/rapprochements`, ({ request }) => {
    const g = exiger(request, 'finances.consulter')
    if (g.refus !== null) return g.refus
    return ok(db().rapprochements)
  }),

  // ——— Paramètres plateforme ———
  http.get(`${API}/plateforme/parametres`, ({ request }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    return ok(db().parametres)
  }),
  http.patch(`${API}/plateforme/parametres`, async ({ request }) => {
    const g = exiger(request, 'admin.parametres.gerer')
    if (g.refus !== null) return g.refus
    const body = await corps<Partial<ParametresPlateforme>>(request)
    const p = db().parametres
    const avant = { ...p }
    for (const cle of ['commissionVoyagePct', 'commissionLocationPct'] as const) {
      const v = body[cle]
      if (v !== undefined && !(v >= 0 && v <= 30)) return erreur(422, 'VALIDATION', 'Un taux de commission doit être compris entre 0 et 30 %.', [{ field: cle, message: 'Taux invalide.' }])
    }
    if (body.dureeBlocageSiegeMin !== undefined && !(body.dureeBlocageSiegeMin >= 2 && body.dureeBlocageSiegeMin <= 30)) {
      return erreur(422, 'VALIDATION', 'Le blocage d’un siège doit durer entre 2 et 30 minutes.', [{ field: 'dureeBlocageSiegeMin', message: 'Durée invalide.' }])
    }
    Object.assign(p, body)
    auditer(g.compte, 'Modification des paramètres de la plateforme', 'parametres_plateforme', 'plateforme', avant, { ...p })
    return ok(p)
  }),

  // ——— Promotions ———
  http.get(`${API}/promotions`, ({ request }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const auteur = auteurDe(g.compte)
    return ok(db().promotions.filter((p) => g.compte.espace === 'admin' || (auteur !== null && p.auteurId === auteur.id)))
  }),
  http.post(`${API}/promotions`, async ({ request }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const perms = permissionsDe(g.compte)
    const auteur = auteurDe(g.compte)
    if (auteur === null || !(perms.includes('commercial.gerer') || perms.includes('business.vehicules.gerer'))) {
      return erreur(403, 'PERMISSION_REFUSEE', 'Accès interdit.')
    }
    const body = await corps<Partial<Promotion>>(request)
    const manquants = champsManquants(body as Record<string, unknown>, { titre: 'Le titre', cible: 'La cible', reductionPct: 'La réduction', debut: 'La date de début', fin: 'La date de fin' })
    if (manquants.length > 0) return erreur(422, 'VALIDATION', 'Vérifiez les champs signalés.', manquants)
    if (!(Number(body.reductionPct) > 0 && Number(body.reductionPct) <= 50)) return erreur(422, 'VALIDATION', 'La réduction doit être comprise entre 1 et 50 %.', [{ field: 'reductionPct', message: 'Réduction invalide.' }])
    if ((body.fin ?? '') < (body.debut ?? '')) return erreur(422, 'VALIDATION', 'La fin doit être après le début.', [{ field: 'fin', message: 'Période invalide.' }])
    const promo: Promotion = {
      id: nouvelId('p'),
      titre: body.titre ?? '',
      description: body.description ?? '',
      auteurType: auteur.type,
      auteurId: auteur.id,
      auteurNom: auteur.nom,
      cible: body.cible ?? 'voyage',
      reductionPct: Number(body.reductionPct),
      debut: body.debut ?? '',
      fin: body.fin ?? '',
      statut: 'brouillon',
    }
    db().promotions.unshift(promo)
    auditer(g.compte, 'Création d’une promotion', 'promotion', promo.id, undefined, { titre: promo.titre })
    return ok(promo, 201)
  }),
  http.post(`${API}/promotions/:id/soumission`, ({ request, params }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const p = db().promotions.find((x) => x.id === params.id)
    const auteur = auteurDe(g.compte)
    if (p === undefined || auteur === null || p.auteurId !== auteur.id) return erreur(404, 'INTROUVABLE', 'Promotion introuvable.')
    if (p.statut !== 'brouillon' && p.statut !== 'refusee') return erreur(409, 'DEJA_SOUMISE', 'Cette promotion est déjà en validation ou validée.')
    p.statut = 'soumise'
    auditer(g.compte, 'Soumission d’une promotion à PROSOFT', 'promotion', p.id)
    return ok(p)
  }),
  http.post(`${API}/promotions/:id/validation`, async ({ request, params }) => {
    const g = exiger(request, 'admin.promotions.valider')
    if (g.refus !== null) return g.refus
    const p = db().promotions.find((x) => x.id === params.id)
    if (p === undefined) return erreur(404, 'INTROUVABLE', 'Promotion introuvable.')
    if (p.statut !== 'soumise') return erreur(409, 'NON_SOUMISE', 'Seule une promotion soumise peut être validée ou refusée.')
    const body = await corps<{ decision?: 'validee' | 'refusee'; motif?: string }>(request)
    if (body.decision === 'refusee' && (body.motif ?? '').trim() === '') {
      return erreur(422, 'VALIDATION', 'Le motif de refus est obligatoire.', [{ field: 'motif', message: 'Motif obligatoire.' }])
    }
    p.statut = body.decision === 'refusee' ? 'refusee' : 'validee'
    p.motifRefus = body.decision === 'refusee' ? body.motif : undefined
    auditer(g.compte, `Promotion ${p.statut}`, 'promotion', p.id, { statut: 'soumise' }, { statut: p.statut, motif: body.motif })
    return ok(p)
  }),

  // ——— Fidélité (règles ⚠ A-9 paramétrables) ———
  http.get(`${API}/fidelite/programmes`, ({ request }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    return ok(db().programmes.filter((p) => g.compte.espace === 'admin' || p.porteurType === 'moncar' || p.porteurId === g.compte.compagnieId))
  }),
  http.patch(`${API}/fidelite/programmes/:id`, async ({ request, params }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const p = db().programmes.find((x) => x.id === params.id)
    if (p === undefined) return erreur(404, 'INTROUVABLE', 'Programme introuvable.')
    const autorise = p.porteurType === 'moncar' ? permissionsDe(g.compte).includes('admin.parametres.gerer') : p.porteurId === g.compte.compagnieId && permissionsDe(g.compte).includes('commercial.gerer')
    if (!autorise) return erreur(403, 'PERMISSION_REFUSEE', 'Accès interdit.')
    const body = await corps<Partial<ProgrammeFidelite>>(request)
    const avant = { pointsPour1000F: p.pointsPour1000F, valeurPointF: p.valeurPointF, validiteMois: p.validiteMois, actif: p.actif }
    for (const cle of ['pointsPour1000F', 'valeurPointF', 'validiteMois', 'actif', 'nom'] as const) {
      if (body[cle] !== undefined) Object.assign(p, { [cle]: body[cle] })
    }
    auditer(g.compte, 'Modification des règles de fidélité', 'programme_fidelite', p.id, avant, { pointsPour1000F: p.pointsPour1000F, valeurPointF: p.valeurPointF, validiteMois: p.validiteMois, actif: p.actif })
    return ok(p)
  }),

  // ——— Litiges ———
  http.get(`${API}/litiges`, ({ request }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const c = g.compte
    return ok(
      db().litiges.filter((l) =>
        c.espace === 'admin' ? permissionsDe(c).includes('admin.litiges.traiter') : c.espace === 'compagnie' ? l.compagnieId === c.compagnieId : l.fournisseurId === c.fournisseurId,
      ),
    )
  }),
  http.post(`${API}/litiges/:id/actions`, async ({ request, params }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const l = db().litiges.find((x) => x.id === params.id)
    const c = g.compte
    const concerne = c.espace === 'admin' || l?.compagnieId === c.compagnieId || (l?.fournisseurId !== undefined && l.fournisseurId === c.fournisseurId)
    if (l === undefined || !concerne) return erreur(404, 'INTROUVABLE', 'Litige introuvable.')
    const body = await corps<{ action?: string; statut?: Litige['statut']; decision?: string }>(request)
    if ((body.action ?? '').trim() === '') return erreur(422, 'VALIDATION', 'Décrivez l’action ou la réponse.', [{ field: 'action', message: 'Texte obligatoire.' }])
    const decide = body.statut !== undefined && body.statut !== l.statut
    if (decide && !permissionsDe(c).includes('admin.litiges.traiter')) {
      return erreur(403, 'PERMISSION_REFUSEE', 'Seul le support PROSOFT peut changer le statut d’un litige.')
    }
    if ((body.statut === 'resolu' || body.statut === 'rejete') && (body.decision ?? '').trim() === '') {
      return erreur(422, 'VALIDATION', 'La décision est obligatoire pour clore le dossier.', [{ field: 'decision', message: 'Décision obligatoire.' }])
    }
    const avant = { statut: l.statut }
    l.historique.push({ date: new Date().toISOString(), auteur: nomComplet(c), action: body.action ?? '' })
    if (body.statut !== undefined) l.statut = body.statut
    if (body.decision !== undefined && body.decision.trim() !== '') l.decision = body.decision
    auditer(c, 'Action sur un litige', 'litige', l.id, avant, { statut: l.statut })
    return ok(l)
  }),
  http.post(`${API}/litiges`, async ({ request }) => {
    const g = exiger(request, 'admin.litiges.traiter')
    if (g.refus !== null) return g.refus
    const body = await corps<Partial<Litige>>(request)
    const manquants = champsManquants(body as Record<string, unknown>, { objet: 'L’objet', plaignant: 'Le plaignant', misEnCause: 'La partie mise en cause' })
    if (manquants.length > 0) return erreur(422, 'VALIDATION', 'Vérifiez les champs signalés.', manquants)
    const maintenant = new Date().toISOString()
    const l: Litige = {
      id: nouvelId('lt'),
      numero: `LIT-${new Date().getFullYear()}-${String(prochainNumero('litige')).padStart(4, '0')}`,
      type: body.type ?? 'voyage',
      objet: body.objet ?? '',
      plaignant: body.plaignant ?? '',
      misEnCause: body.misEnCause ?? '',
      compagnieId: body.compagnieId,
      fournisseurId: body.fournisseurId,
      statut: 'ouvert',
      creeLe: maintenant,
      historique: [{ date: maintenant, auteur: nomComplet(g.compte), action: 'Dossier ouvert par le support' }],
    }
    db().litiges.unshift(l)
    auditer(g.compte, 'Ouverture d’un litige', 'litige', l.id)
    return ok(l, 201)
  }),

  // ——— Journal d'audit (lecture seule) ———
  http.get(`${API}/audit/journal`, ({ request }) => {
    const g = exiger(request, 'audit.consulter')
    if (g.refus !== null) return g.refus
    const q = new URL(request.url).searchParams
    const recherche = (q.get('q') ?? '').toLowerCase()
    const cid = compagnieDe(g.compte)
    return ok(
      db()
        .audit.filter((a) => (cid === undefined ? true : a.compagnieId === cid))
        .filter((a) => recherche === '' || `${a.auteur} ${a.action} ${a.entite}`.toLowerCase().includes(recherche))
        .slice(0, 300),
    )
  }),
]

