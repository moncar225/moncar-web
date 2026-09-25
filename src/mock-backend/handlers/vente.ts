/**
 * ⚠️ FAUX BACKEND — caisse et vente au guichet (CAI-001), réservations
 * (RES-001) — roadmap §9.4 / §9.5. Montants toujours calculés ici (serveur),
 * vente idempotente (Idempotency-Key), écarts de caisse signalés.
 */
import { http, HttpResponse, type HttpHandler } from 'msw'
import type { MoyenPaiement, Reservation, SessionCaisse } from '@/domain/types'
import { db, nouvelId, prochainNumero } from '../db'
import { ligneDe, prixSegment, siegesOccupes } from '../metier'
import { API, auditer, corps, erreur, exiger, nomComplet, ok } from '../http'

/** Réponses déjà rendues par clé d'idempotence (rejeu sans doublon). */
const rejeux = new Map<string, unknown>()

export function reinitialiserRejeux(): void {
  rejeux.clear()
}

function journal(session: SessionCaisse) {
  const ventes = db().reservations.filter((r) => r.sessionCaisseId === session.id)
  const actives = ventes.filter((r) => r.statut !== 'annulee')
  const parMoyen: Record<string, number> = {}
  for (const r of actives) parMoyen[r.moyen ?? 'especes'] = (parMoyen[r.moyen ?? 'especes'] ?? 0) + r.montant
  const especes = parMoyen.especes ?? 0
  return {
    session,
    ventes: ventes
      .sort((a, b) => b.creeLe.localeCompare(a.creeLe))
      .map((r) => {
        const v = db().voyages.find((x) => x.id === r.voyageId)
        const l = v === undefined ? undefined : ligneDe(v)
        return {
          ...r,
          voyageReference: v?.reference ?? '—',
          depart: v?.depart ?? r.creeLe,
          trajet: `${l?.arrets[r.montee]?.nom ?? '?'} → ${l?.arrets[r.descente]?.nom ?? '?'}`,
        }
      }),
    totalVentes: actives.reduce((s, r) => s + r.montant, 0),
    nombreBillets: actives.length,
    parMoyen,
    especesAttendues: session.fondInitial + especes,
  }
}

export const venteHandlers: HttpHandler[] = [
  http.get(`${API}/caisse/session-courante`, ({ request }) => {
    const g = exiger(request, 'caisse.vendre')
    if (g.refus !== null) return g.refus
    const s = db().sessionsCaisse.find((x) => x.caissierId === g.compte.id && x.statut === 'ouverte')
    return ok(s === undefined ? null : journal(s))
  }),

  http.post(`${API}/caisse/sessions`, async ({ request }) => {
    const g = exiger(request, 'caisse.vendre')
    if (g.refus !== null) return g.refus
    if (g.compte.gareId === undefined) return erreur(409, 'SANS_GARE', 'Votre compte n’est rattaché à aucune gare.')
    if (db().sessionsCaisse.some((x) => x.caissierId === g.compte.id && x.statut === 'ouverte')) {
      return erreur(409, 'CAISSE_DEJA_OUVERTE', 'Votre caisse est déjà ouverte.')
    }
    const body = await corps<{ fondInitial?: number }>(request)
    const session: SessionCaisse = {
      id: nouvelId('sc'),
      gareId: g.compte.gareId,
      caissierId: g.compte.id,
      ouverture: new Date().toISOString(),
      fondInitial: Math.max(0, Number(body.fondInitial ?? 0)),
      statut: 'ouverte',
    }
    db().sessionsCaisse.push(session)
    auditer(g.compte, 'Ouverture de caisse', 'session_caisse', session.id, undefined, { fondInitial: session.fondInitial })
    return ok(journal(session), 201)
  }),

  http.get(`${API}/caisse/:id/journal`, ({ request, params }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const s = db().sessionsCaisse.find((x) => x.id === params.id)
    const gare = db().gares.find((x) => x.id === s?.gareId)
    if (s === undefined || gare?.compagnieId !== g.compte.compagnieId) return erreur(404, 'INTROUVABLE', 'Caisse introuvable.')
    return ok(journal(s))
  }),

  http.get(`${API}/caisse/sessions`, ({ request }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const gares = db().gares.filter((x) => x.compagnieId === g.compte.compagnieId).map((x) => x.id)
    return ok(
      db()
        .sessionsCaisse.filter((s) => gares.includes(s.gareId))
        .sort((a, b) => b.ouverture.localeCompare(a.ouverture))
        .map((s) => {
          const j = journal(s)
          const caissier = db().comptes.find((c) => c.id === s.caissierId)
          return {
            ...s,
            caissier: caissier === undefined ? '—' : nomComplet(caissier),
            gare: db().gares.find((x) => x.id === s.gareId)?.nom ?? '—',
            totalVentes: j.totalVentes,
            nombreBillets: j.nombreBillets,
            especesAttendues: j.especesAttendues,
          }
        }),
    )
  }),

  http.post(`${API}/caisse/ventes`, async ({ request }) => {
    const g = exiger(request, 'caisse.vendre')
    if (g.refus !== null) return g.refus
    const cle = request.headers.get('Idempotency-Key')
    if (cle !== null && rejeux.has(cle)) return HttpResponse.json(rejeux.get(cle) as Record<string, unknown>, { status: 201 })
    const session = db().sessionsCaisse.find((x) => x.caissierId === g.compte.id && x.statut === 'ouverte')
    if (session === undefined) return erreur(409, 'CAISSE_FERMEE', 'Ouvrez votre caisse avant de vendre.')
    const body = await corps<{
      voyageId: string
      montee: number
      descente: number
      moyen: MoyenPaiement
      passagers: Array<{ siege: string; nom: string; telephone: string; bagages?: number }>
    }>(request)
    const voyage = db().voyages.find((v) => v.id === body.voyageId)
    if (voyage === undefined || voyage.compagnieId !== g.compte.compagnieId) return erreur(404, 'INTROUVABLE', 'Voyage introuvable.')
    if (voyage.statut === 'annule' || voyage.statut === 'arrive' || voyage.statut === 'en_route') {
      return erreur(409, 'VOYAGE_NON_VENDABLE', 'Ce voyage n’est plus vendable (parti, arrivé ou annulé).')
    }
    const ligne = ligneDe(voyage)
    if (ligne === undefined || !(body.descente > body.montee)) return erreur(422, 'SEGMENT_INVALIDE', 'Trajet invalide.')
    if (body.passagers.length === 0) return erreur(422, 'VALIDATION', 'Choisissez au moins un siège.')
    const manquants = body.passagers.flatMap((p, i) =>
      p.nom.trim() === '' ? [{ field: `passagers.${i}.nom`, message: `Nom du passager du siège ${p.siege} obligatoire.` }] : [],
    )
    if (manquants.length > 0) return erreur(422, 'VALIDATION', 'Renseignez le nom de chaque passager.', manquants)
    // Contrainte d'exclusion : dernier rempart contre la double vente.
    const pris = siegesOccupes(voyage.id, body.montee, body.descente)
    const conflits = body.passagers.filter((p) => pris.has(p.siege)).map((p) => p.siege)
    if (conflits.length > 0) {
      return erreur(409, 'SIEGE_PRIS', `Siège(s) ${conflits.join(', ')} vendu(s) entre-temps sur ce trajet. Choisissez un autre siège.`)
    }
    const prix = prixSegment(voyage, ligne, body.montee, body.descente)
    const maintenant = new Date().toISOString()
    const billets: Reservation[] = body.passagers.map((p) => {
      const n = prochainNumero('billet')
      return {
        id: nouvelId('r'),
        voyageId: voyage.id,
        siege: p.siege,
        montee: body.montee,
        descente: body.descente,
        passager: { nom: p.nom.trim(), telephone: p.telephone.trim() },
        statut: 'payee',
        canal: 'guichet',
        montant: prix,
        moyen: body.moyen,
        billetNumero: `MC-${new Date().getFullYear()}-${String(n).padStart(6, '0')}`,
        sessionCaisseId: session.id,
        bagages: Number(p.bagages ?? 0),
        creeLe: maintenant,
      }
    })
    db().reservations.push(...billets)
    for (const b of billets) {
      db().ecritures.push({
        id: nouvelId('e'),
        date: maintenant,
        journal: 'caisse',
        libelle: `Vente guichet ${b.billetNumero}`,
        compteDebit: body.moyen === 'especes' ? '531 Caisse gare' : '512 Encaissements mobile money',
        compteCredit: '467 Dette compagnie',
        montant: b.montant,
        reference: b.billetNumero,
        compagnieId: voyage.compagnieId,
      })
    }
    auditer(g.compte, `Vente guichet (${billets.length} billet(s))`, 'voyage', voyage.id, undefined, {
      sieges: billets.map((b) => b.siege),
      total: prix * billets.length,
    })
    const reponse = {
      billets: billets.map((b) => ({
        ...b,
        voyageReference: voyage.reference,
        depart: voyage.depart,
        trajet: `${ligne.arrets[b.montee]?.nom ?? ''} → ${ligne.arrets[b.descente]?.nom ?? ''}`,
        compagnie: db().compagnies.find((c) => c.id === voyage.compagnieId)?.nom ?? '',
      })),
      total: prix * billets.length,
      prixUnitaire: prix,
    }
    if (cle !== null) rejeux.set(cle, reponse)
    return ok(reponse, 201)
  }),

  http.post(`${API}/reservations/:id/annulation`, async ({ request, params }) => {
    const g = exiger(request, 'caisse.vendre')
    if (g.refus !== null) return g.refus
    const r = db().reservations.find((x) => x.id === params.id)
    const session = db().sessionsCaisse.find((x) => x.caissierId === g.compte.id && x.statut === 'ouverte')
    if (r === undefined) return erreur(404, 'INTROUVABLE', 'Billet introuvable.')
    // Règles d'annulation ⚠ A-5 non tranchées : seule la caisse qui a vendu, avant clôture.
    if (session === undefined || r.sessionCaisseId !== session.id) {
      return erreur(409, 'ANNULATION_IMPOSSIBLE', 'Seule une vente de votre caisse ouverte peut être annulée ici.')
    }
    if (r.statut !== 'payee') return erreur(409, 'ANNULATION_IMPOSSIBLE', 'Ce billet a déjà été utilisé ou annulé.')
    const body = await corps<{ motif?: string }>(request)
    if ((body.motif ?? '').trim() === '') {
      return erreur(422, 'VALIDATION', 'Le motif est obligatoire.', [{ field: 'motif', message: 'Motif obligatoire.' }])
    }
    r.statut = 'annulee'
    const voyage = db().voyages.find((v) => v.id === r.voyageId)
    db().ecritures.push({
      id: nouvelId('e'),
      date: new Date().toISOString(),
      journal: 'remboursement',
      libelle: `Annulation ${r.billetNumero} — ${body.motif ?? ''}`,
      compteDebit: '467 Dette compagnie',
      compteCredit: r.moyen === 'especes' ? '531 Caisse gare' : '512 Encaissements mobile money',
      montant: r.montant,
      reference: r.billetNumero,
      compagnieId: voyage?.compagnieId,
    })
    auditer(g.compte, `Annulation d’un billet : ${body.motif ?? ''}`, 'billet', r.id, { statut: 'payee' }, { statut: 'annulee' })
    return ok(r)
  }),

  http.post(`${API}/caisse/:id/cloture`, async ({ request, params }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const s = db().sessionsCaisse.find((x) => x.id === params.id)
    if (s === undefined) return erreur(404, 'INTROUVABLE', 'Caisse introuvable.')
    const estCaissier = s.caissierId === g.compte.id
    const gare = db().gares.find((x) => x.id === s.gareId)
    const estChef = g.compte.poste === 'chef_gare' && gare?.compagnieId === g.compte.compagnieId
    if (!estCaissier && !estChef) return erreur(403, 'PERMISSION_REFUSEE', 'Accès interdit.')
    if (s.statut === 'cloturee') return erreur(409, 'DEJA_CLOTUREE', 'Cette caisse est déjà clôturée.')
    const body = await corps<{ montantDeclare?: number; commentaire?: string }>(request)
    const declare = Number(body.montantDeclare)
    if (!Number.isFinite(declare) || declare < 0) {
      return erreur(422, 'VALIDATION', 'Saisissez le montant compté.', [{ field: 'montantDeclare', message: 'Montant invalide.' }])
    }
    const attendu = journal(s).especesAttendues
    const ecart = declare - attendu
    if (ecart !== 0 && (body.commentaire ?? '').trim() === '') {
      return erreur(422, 'ECART_A_JUSTIFIER', `Écart de ${ecart} F : un commentaire est obligatoire (l’écart est signalé, jamais masqué).`, [
        { field: 'commentaire', message: 'Justifiez l’écart.' },
      ])
    }
    s.statut = 'cloturee'
    s.cloture = new Date().toISOString()
    s.montantDeclare = declare
    s.ecart = ecart
    s.commentaireEcart = body.commentaire?.trim() || undefined
    auditer(g.compte, ecart === 0 ? 'Clôture de caisse' : 'Clôture de caisse avec écart', 'session_caisse', s.id, { statut: 'ouverte' }, { statut: 'cloturee', attendu, declare, ecart })
    return ok(journal(s))
  }),
]
