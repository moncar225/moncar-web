/**
 * ⚠️ FAUX BACKEND — espace BUSINESS : fournisseurs de location, véhicules,
 * disponibilités, demandes, revenus (LOC-001 → LOC-006) — roadmap §9.7.
 * Règle VTC portée par le serveur : mode « vtc » ⇒ avec chauffeur obligatoire.
 */
import { http, HttpResponse, type HttpHandler } from 'msw'
import type { Compte, Indisponibilite, VehiculeLocation } from '@/domain/types'
import { db, nouvelId } from '../db'
import { API, auditer, champsManquants, corps, erreur, exiger, ok } from '../http'

function fournisseurDe(compte: Compte) {
  return db().fournisseurs.find((f) => f.id === compte.fournisseurId)
}

function chevauchent(a1: string, a2: string, b1: string, b2: string): boolean {
  return a1 <= b2 && b1 <= a2
}

/** Règle VTC (CDC §32) + cohérence des modes de conduite. */
function regleConduite(v: Pick<VehiculeLocation, 'mode' | 'avecChauffeur' | 'sansChauffeur'>, vtcAutorise: boolean): string | null {
  if (v.mode === 'vtc' && !vtcAutorise) return 'Votre compte n’a pas d’autorisation VTC : ce mode n’est pas disponible.'
  if (v.mode === 'vtc' && (v.sansChauffeur || !v.avecChauffeur)) return 'Un véhicule VTC est obligatoirement fourni avec chauffeur : l’option « sans chauffeur » est interdite.'
  if (!v.avecChauffeur && !v.sansChauffeur) return 'Choisissez au moins un mode : avec ou sans chauffeur.'
  return null
}

function revenus(fournisseurId: string) {
  const taux = db().parametres.commissionLocationPct
  const demandes = db().demandes.filter((d) => d.fournisseurId === fournisseurId && ['payee', 'en_cours', 'terminee'].includes(d.statut))
  const parMois = new Map<string, { brut: number; locations: number }>()
  for (const d of demandes) {
    const mois = d.debut.slice(0, 7)
    const m = parMois.get(mois) ?? { brut: 0, locations: 0 }
    m.brut += d.montant
    m.locations += 1
    parMois.set(mois, m)
  }
  const sequestre = demandes.filter((d) => d.statut !== 'terminee').reduce((s, d) => s + d.montant, 0)
  const regle = demandes.filter((d) => d.statut === 'terminee').reduce((s, d) => s + d.montant, 0)
  return {
    tauxCommission: taux,
    // Fonds conservés par MON CAR jusqu'à la restitution (séquestre, ⚠ avis juridique A-7).
    enSequestre: sequestre,
    regleBrut: regle,
    regleNet: Math.round(regle * (1 - taux / 100)),
    parMois: [...parMois.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([mois, m]) => ({ mois, locations: m.locations, brut: m.brut, commission: Math.round((m.brut * taux) / 100), net: Math.round(m.brut * (1 - taux / 100)) })),
  }
}

export const businessHandlers: HttpHandler[] = [
  http.get(`${API}/business/tableau-de-bord`, ({ request }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const f = fournisseurDe(g.compte)
    if (f === undefined) return erreur(403, 'PERMISSION_REFUSEE', 'Accès interdit.')
    const vehicules = db().vehiculesLocation.filter((v) => v.fournisseurId === f.id)
    const demandes = db().demandes.filter((d) => d.fournisseurId === f.id)
    return ok({
      fournisseur: f,
      vehiculesPublies: vehicules.filter((v) => v.statut === 'publie').length,
      vehicules: vehicules.length,
      demandesATraiter: demandes.filter((d) => d.statut === 'recue').length,
      locationsEnCours: demandes.filter((d) => d.statut === 'payee' || d.statut === 'en_cours').length,
      revenus: revenus(f.id),
      prochaines: demandes
        .filter((d) => ['acceptee', 'payee', 'en_cours'].includes(d.statut))
        .sort((a, b) => a.debut.localeCompare(b.debut))
        .slice(0, 5)
        .map((d) => ({ ...d, vehicule: vehicules.find((v) => v.id === d.vehiculeId)?.titre ?? '—' })),
    })
  }),

  // ——— Véhicules ———
  http.get(`${API}/business/vehicules`, ({ request }) => {
    const g = exiger(request, 'business.vehicules.gerer')
    if (g.refus !== null) return g.refus
    return ok(db().vehiculesLocation.filter((v) => v.fournisseurId === g.compte.fournisseurId))
  }),
  http.post(`${API}/business/vehicules`, async ({ request }) => {
    const g = exiger(request, 'business.vehicules.gerer')
    if (g.refus !== null) return g.refus
    const f = fournisseurDe(g.compte)
    if (f === undefined) return erreur(403, 'PERMISSION_REFUSEE', 'Accès interdit.')
    if (f.statut !== 'validee') return erreur(409, 'FOURNISSEUR_NON_VALIDE', 'Votre compte doit être validé par PROSOFT avant de publier des véhicules.')
    const body = await corps<Partial<VehiculeLocation>>(request)
    const manquants = champsManquants(body as Record<string, unknown>, { titre: 'Le titre', categorie: 'La catégorie', places: 'Le nombre de places', tarifJour: 'Le tarif journalier' })
    if (manquants.length > 0) return erreur(422, 'VALIDATION', 'Vérifiez les champs signalés.', manquants)
    const v: VehiculeLocation = {
      id: nouvelId('vl'),
      fournisseurId: f.id,
      titre: body.titre ?? '',
      categorie: body.categorie ?? 'berline',
      places: Number(body.places),
      mode: body.mode ?? 'standard',
      avecChauffeur: body.avecChauffeur ?? true,
      sansChauffeur: body.sansChauffeur ?? false,
      villeId: body.villeId ?? f.villeId,
      tarifJour: Number(body.tarifJour),
      tarifDemiJour: Number(body.tarifDemiJour ?? Math.round(Number(body.tarifJour) * 0.6)),
      supplementExterieurJour: Number(body.supplementExterieurJour ?? 0),
      statut: 'brouillon',
    }
    const regle = regleConduite(v, f.vtc)
    if (regle !== null) return erreur(422, 'REGLE_VTC', regle, [{ field: 'sansChauffeur', message: regle }])
    db().vehiculesLocation.push(v)
    auditer(g.compte, 'Ajout d’un véhicule de location', 'vehicule_location', v.id, undefined, { titre: v.titre, mode: v.mode })
    return ok(v, 201)
  }),
  http.patch(`${API}/business/vehicules/:id`, async ({ request, params }) => {
    const g = exiger(request, 'business.vehicules.gerer')
    if (g.refus !== null) return g.refus
    const v = db().vehiculesLocation.find((x) => x.id === params.id && x.fournisseurId === g.compte.fournisseurId)
    const f = fournisseurDe(g.compte)
    if (v === undefined || f === undefined) return erreur(404, 'INTROUVABLE', 'Véhicule introuvable.')
    const body = await corps<Partial<VehiculeLocation>>(request)
    const suivant = { ...v, ...body }
    const regle = regleConduite(suivant, f.vtc)
    if (regle !== null) return erreur(422, 'REGLE_VTC', regle, [{ field: 'sansChauffeur', message: regle }])
    const avant = { statut: v.statut, tarifJour: v.tarifJour, mode: v.mode }
    for (const cle of ['titre', 'categorie', 'places', 'mode', 'avecChauffeur', 'sansChauffeur', 'tarifJour', 'tarifDemiJour', 'supplementExterieurJour', 'statut'] as const) {
      if (body[cle] !== undefined) Object.assign(v, { [cle]: body[cle] })
    }
    auditer(g.compte, 'Modification d’un véhicule de location', 'vehicule_location', v.id, avant, { statut: v.statut, tarifJour: v.tarifJour, mode: v.mode })
    return ok(v)
  }),

  // ——— Disponibilités ———
  http.get(`${API}/business/disponibilites`, ({ request }) => {
    const g = exiger(request, 'business.vehicules.gerer')
    if (g.refus !== null) return g.refus
    const ids = new Set(db().vehiculesLocation.filter((v) => v.fournisseurId === g.compte.fournisseurId).map((v) => v.id))
    const demandes = db()
      .demandes.filter((d) => ids.has(d.vehiculeId) && ['acceptee', 'payee', 'en_cours'].includes(d.statut))
      .map((d) => ({ id: `loc-${d.id}`, vehiculeId: d.vehiculeId, debut: d.debut, fin: d.fin, motif: 'location' as const, demande: d.numero }))
    return ok([...db().indisponibilites.filter((i) => ids.has(i.vehiculeId)), ...demandes].sort((a, b) => a.debut.localeCompare(b.debut)))
  }),
  http.post(`${API}/business/disponibilites`, async ({ request }) => {
    const g = exiger(request, 'business.vehicules.gerer')
    if (g.refus !== null) return g.refus
    const body = await corps<Partial<Indisponibilite>>(request)
    const v = db().vehiculesLocation.find((x) => x.id === body.vehiculeId && x.fournisseurId === g.compte.fournisseurId)
    if (v === undefined) return erreur(404, 'INTROUVABLE', 'Véhicule introuvable.')
    if (body.debut === undefined || body.fin === undefined || body.fin < body.debut) return erreur(422, 'VALIDATION', 'Période invalide.', [{ field: 'fin', message: 'La fin doit être après le début.' }])
    const location = db().demandes.find((d) => d.vehiculeId === v.id && ['acceptee', 'payee', 'en_cours'].includes(d.statut) && chevauchent(d.debut, d.fin, body.debut ?? '', body.fin ?? ''))
    if (location !== undefined) return erreur(409, 'LOCATION_CONFIRMEE', `La location ${location.numero} est confirmée sur cette période.`)
    const i: Indisponibilite = { id: nouvelId('in'), vehiculeId: v.id, debut: body.debut, fin: body.fin, motif: body.motif === 'maintenance' ? 'maintenance' : 'indisponible' }
    db().indisponibilites.push(i)
    auditer(g.compte, 'Période d’indisponibilité ajoutée', 'vehicule_location', v.id, undefined, i)
    return ok(i, 201)
  }),
  http.delete(`${API}/business/disponibilites/:id`, ({ request, params }) => {
    const g = exiger(request, 'business.vehicules.gerer')
    if (g.refus !== null) return g.refus
    const i = db().indisponibilites.find((x) => x.id === params.id)
    const v = db().vehiculesLocation.find((x) => x.id === i?.vehiculeId && x.fournisseurId === g.compte.fournisseurId)
    if (i === undefined || v === undefined) return erreur(404, 'INTROUVABLE', 'Période introuvable.')
    db().indisponibilites = db().indisponibilites.filter((x) => x.id !== i.id)
    auditer(g.compte, 'Période d’indisponibilité supprimée', 'vehicule_location', v.id, i, undefined)
    return new HttpResponse(null, { status: 204 })
  }),

  // ——— Demandes ———
  http.get(`${API}/business/demandes`, ({ request }) => {
    const g = exiger(request, 'business.demandes.traiter')
    if (g.refus !== null) return g.refus
    const vehicules = db().vehiculesLocation
    return ok(
      db()
        .demandes.filter((d) => d.fournisseurId === g.compte.fournisseurId)
        .sort((a, b) => Number(b.statut === 'recue') - Number(a.statut === 'recue') || b.creeLe.localeCompare(a.creeLe))
        .map((d) => ({ ...d, vehicule: vehicules.find((v) => v.id === d.vehiculeId)?.titre ?? '—' })),
    )
  }),
  http.post(`${API}/locations/demandes/:id/reponse`, async ({ request, params }) => {
    const g = exiger(request, 'business.demandes.traiter')
    if (g.refus !== null) return g.refus
    const d = db().demandes.find((x) => x.id === params.id && x.fournisseurId === g.compte.fournisseurId)
    if (d === undefined) return erreur(404, 'INTROUVABLE', 'Demande introuvable.')
    if (d.statut !== 'recue') return erreur(409, 'DEJA_TRAITEE', 'Cette demande a déjà reçu une réponse.')
    const body = await corps<{ decision?: 'acceptee' | 'refusee'; motif?: string }>(request)
    if (body.decision === 'refusee' && (body.motif ?? '').trim() === '') {
      return erreur(422, 'VALIDATION', 'Le motif du refus est obligatoire (il est transmis au client).', [{ field: 'motif', message: 'Motif obligatoire.' }])
    }
    if (body.decision === 'acceptee') {
      const conflitLocation = db().demandes.find((x) => x.id !== d.id && x.vehiculeId === d.vehiculeId && ['acceptee', 'payee', 'en_cours'].includes(x.statut) && chevauchent(x.debut, x.fin, d.debut, d.fin))
      const conflitIndispo = db().indisponibilites.find((i) => i.vehiculeId === d.vehiculeId && chevauchent(i.debut, i.fin, d.debut, d.fin))
      if (conflitLocation !== undefined || conflitIndispo !== undefined) {
        return erreur(409, 'VEHICULE_INDISPONIBLE', 'Le véhicule n’est pas disponible sur cette période : refusez la demande avec un motif.')
      }
    }
    d.statut = body.decision === 'acceptee' ? 'acceptee' : 'refusee'
    d.motifRefus = body.decision === 'refusee' ? body.motif : undefined
    // Enchaînement imposé : demande → confirmation → facture → paiement du client.
    auditer(g.compte, `Demande de location ${d.statut}`, 'demande_location', d.id, { statut: 'recue' }, { statut: d.statut, motif: body.motif })
    return ok(d)
  }),

  http.get(`${API}/business/revenus`, ({ request }) => {
    const g = exiger(request, 'business.revenus.consulter')
    if (g.refus !== null) return g.refus
    if (g.compte.fournisseurId === undefined) return erreur(403, 'PERMISSION_REFUSEE', 'Accès interdit.')
    return ok(revenus(g.compte.fournisseurId))
  }),
]
