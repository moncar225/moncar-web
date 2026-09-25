/**
 * ⚠️ FAUX BACKEND — exploitation de la gare (MAN-001, MAN-002) et
 * service colis (COL-001, COL-002) — roadmap §9.4 / §9.6.
 */
import { http, type HttpHandler } from 'msw'
import type { Colis, EtapeColis, StatutVoyage } from '@/domain/types'
import { jourDe } from '@/lib/format'
import { db, nouvelId, prochainNumero } from '../db'
import { gareSuivante, heurePassage, ligneDe, manifeste, reservationActive } from '../metier'
import { API, auditer, champsManquants, corps, erreur, exiger, nomComplet, ok, visibleParCompagnie } from '../http'
import { resumeVoyage } from './exploitation'

const ORDRE_COLIS: EtapeColis[] = ['enregistre', 'recu', 'controle', 'charge', 'en_transit', 'arrive', 'disponible', 'remis']

/** Tarif colis en configuration (pas en dur dans les écrans) : base + poids + valeur. */
function tarifColis(poidsKg: number, valeurDeclaree: number): number {
  return Math.max(1500, Math.round((1000 + poidsKg * 250 + valeurDeclaree * 0.01) / 100) * 100) + db().parametres.fraisOperationColis
}

export const gareHandlers: HttpHandler[] = [
  // Tableau des départs et arrivées d'une gare pour une date.
  http.get(`${API}/gares/:id/tableau`, ({ request, params }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const gare = db().gares.find((x) => x.id === params.id)
    if (gare === undefined || !visibleParCompagnie(g.compte, gare.compagnieId)) return erreur(404, 'INTROUVABLE', 'Gare introuvable.')
    const jour = new URL(request.url).searchParams.get('date') ?? jourDe(new Date())
    const lignes = db().voyages.flatMap((v) => {
      const ligne = ligneDe(v)
      const arret = ligne?.arrets.find((a) => a.gareId === gare.id)
      if (ligne === undefined || arret === undefined) return []
      const passage = heurePassage(v, ligne, arret.ordre)
      if (jourDe(passage) !== jour) return []
      const res = db().reservations.filter((r) => r.voyageId === v.id && reservationActive(r))
      const dernier = arret.ordre === ligne.arrets.length - 1
      return [
        {
          ...resumeVoyage(v),
          sens: arret.ordre === 0 ? ('depart' as const) : dernier ? ('arrivee' as const) : ('passage' as const),
          ordreGare: arret.ordre,
          heureGare: passage,
          aEmbarquer: res.filter((r) => r.montee === arret.ordre).length,
          embarques: res.filter((r) => r.montee === arret.ordre && (r.statut === 'embarquee' || r.statut === 'descendue')).length,
          aDebarquer: res.filter((r) => r.descente === arret.ordre).length,
        },
      ]
    })
    return ok(lignes.sort((a, b) => a.heureGare.localeCompare(b.heureGare)))
  }),

  http.get(`${API}/voyages/:id/manifeste`, ({ request, params }) => {
    const g = exiger(request, 'manifeste.consulter')
    if (g.refus !== null) return g.refus
    const v = db().voyages.find((x) => x.id === params.id)
    if (v === undefined || !visibleParCompagnie(g.compte, v.compagnieId)) return erreur(404, 'INTROUVABLE', 'Voyage introuvable.')
    return ok({ voyage: resumeVoyage(v), ...manifeste(v), genereLe: new Date().toISOString() })
  }),

  http.get(`${API}/voyages/:id/information-gare-suivante`, ({ request, params }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const v = db().voyages.find((x) => x.id === params.id)
    if (v === undefined || !visibleParCompagnie(g.compte, v.compagnieId)) return erreur(404, 'INTROUVABLE', 'Voyage introuvable.')
    return ok({ voyage: resumeVoyage(v), suivante: gareSuivante(v) })
  }),

  // Le chef de gare fait avancer le voyage (embarquement, départ, passage, arrivée).
  http.post(`${API}/voyages/:id/progression`, async ({ request, params }) => {
    const g = exiger(request, 'gare.exploiter')
    if (g.refus !== null) return g.refus
    const v = db().voyages.find((x) => x.id === params.id)
    if (v === undefined || !visibleParCompagnie(g.compte, v.compagnieId)) return erreur(404, 'INTROUVABLE', 'Voyage introuvable.')
    const ligne = ligneDe(v)
    if (ligne === undefined) return erreur(404, 'INTROUVABLE', 'Ligne introuvable.')
    const body = await corps<{ action: 'embarquement' | 'depart' | 'passage' }>(request)
    const avant = { statut: v.statut, dernierArretFranchi: v.dernierArretFranchi }
    const suivant: Partial<Record<StatutVoyage, StatutVoyage>> = { programme: 'embarquement' }
    if (body.action === 'embarquement') {
      if (suivant[v.statut] !== 'embarquement') return erreur(409, 'TRANSITION_INVALIDE', 'L’embarquement ne peut pas être ouvert pour ce voyage.')
      v.statut = 'embarquement'
    } else if (body.action === 'depart') {
      if (v.statut !== 'embarquement') return erreur(409, 'TRANSITION_INVALIDE', 'Ouvrez d’abord l’embarquement.')
      if (v.vehiculeId === undefined || v.chauffeurId === undefined) return erreur(409, 'SANS_EQUIPAGE', 'Véhicule et chauffeur doivent être affectés avant le départ.')
      v.statut = 'en_route'
      v.dernierArretFranchi = 0
    } else {
      if (v.statut !== 'en_route') return erreur(409, 'TRANSITION_INVALIDE', 'Le voyage n’est pas en route.')
      v.dernierArretFranchi = Math.min(ligne.arrets.length - 1, v.dernierArretFranchi + 1)
      // Débarquement : les sièges sont libérés sur les segments suivants.
      for (const r of db().reservations) {
        if (r.voyageId === v.id && r.descente <= v.dernierArretFranchi && r.statut === 'embarquee') r.statut = 'descendue'
      }
      if (v.dernierArretFranchi === ligne.arrets.length - 1) v.statut = 'arrive'
    }
    auditer(g.compte, `Progression du voyage : ${body.action}`, 'voyage', v.id, avant, { statut: v.statut, dernierArretFranchi: v.dernierArretFranchi })
    return ok(resumeVoyage(v))
  }),

  // ——— Colis ———
  http.get(`${API}/gares/:id/colis`, ({ request, params }) => {
    const g = exiger(request, 'colis.gerer')
    if (g.refus !== null) return g.refus
    const gare = db().gares.find((x) => x.id === params.id)
    if (gare === undefined || !visibleParCompagnie(g.compte, gare.compagnieId)) return erreur(404, 'INTROUVABLE', 'Gare introuvable.')
    return ok(db().colis.filter((c) => c.gareDepartId === gare.id || c.gareArriveeId === gare.id))
  }),
  http.post(`${API}/colis/devis`, async ({ request }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const body = await corps<{ poidsKg?: number; valeurDeclaree?: number }>(request)
    const poids = Number(body.poidsKg ?? 0)
    if (!(poids > 0 && poids <= 100)) return erreur(422, 'POIDS_INVALIDE', 'Le poids doit être compris entre 0 et 100 kg.', [{ field: 'poidsKg', message: 'Poids invalide.' }])
    return ok({ montant: tarifColis(poids, Number(body.valeurDeclaree ?? 0)), fraisOperation: db().parametres.fraisOperationColis })
  }),
  http.post(`${API}/colis`, async ({ request }) => {
    const g = exiger(request, 'colis.gerer')
    if (g.refus !== null) return g.refus
    const body = await corps<Partial<Colis> & { expediteurNom?: string; expediteurTel?: string; destinataireNom?: string; destinataireTel?: string }>(request)
    const manquants = champsManquants(body as Record<string, unknown>, {
      expediteurNom: 'Le nom de l’expéditeur',
      expediteurTel: 'Le téléphone de l’expéditeur',
      destinataireNom: 'Le nom du destinataire',
      destinataireTel: 'Le téléphone du destinataire',
      gareArriveeId: 'La gare d’arrivée',
      nature: 'La nature du colis',
      poidsKg: 'Le poids',
    })
    if (manquants.length > 0) return erreur(422, 'VALIDATION', 'Vérifiez les champs signalés.', manquants)
    if (g.compte.gareId === undefined) return erreur(409, 'SANS_GARE', 'Votre compte n’est rattaché à aucune gare.')
    if (body.gareArriveeId === g.compte.gareId) return erreur(422, 'TRAJET_INVALIDE', 'La gare d’arrivée doit être différente de la gare de dépôt.')
    const poids = Number(body.poidsKg)
    const gare = db().gares.find((x) => x.id === g.compte.gareId)
    const maintenant = new Date().toISOString()
    const colis: Colis = {
      id: nouvelId('co'),
      numero: `COL-MC-${new Date().getFullYear()}-${String(prochainNumero('colis')).padStart(6, '0')}`,
      compagnieId: g.compte.compagnieId ?? '',
      gareDepartId: g.compte.gareId,
      gareArriveeId: body.gareArriveeId ?? '',
      expediteur: { nom: body.expediteurNom ?? '', telephone: body.expediteurTel ?? '' },
      destinataire: { nom: body.destinataireNom ?? '', telephone: body.destinataireTel ?? '' },
      nature: body.nature ?? '',
      poidsKg: poids,
      valeurDeclaree: Number(body.valeurDeclaree ?? 0),
      montant: tarifColis(poids, Number(body.valeurDeclaree ?? 0)),
      statut: 'recu',
      historique: [
        { etape: 'enregistre', date: maintenant, auteur: nomComplet(g.compte), lieu: gare?.nom ?? '' },
        { etape: 'recu', date: maintenant, auteur: nomComplet(g.compte), lieu: gare?.nom ?? '' },
      ],
    }
    db().colis.unshift(colis)
    auditer(g.compte, 'Enregistrement d’un colis', 'colis', colis.id, undefined, { numero: colis.numero, montant: colis.montant })
    return ok(colis, 201)
  }),
  http.get(`${API}/colis/:numero/suivi`, ({ request, params }) => {
    const g = exiger(request)
    if (g.refus !== null) return g.refus
    const c = db().colis.find((x) => x.numero === params.numero)
    if (c === undefined || !visibleParCompagnie(g.compte, c.compagnieId)) return erreur(404, 'INTROUVABLE', 'Colis introuvable.')
    return ok(c)
  }),
  http.post(`${API}/colis/:id/etapes`, async ({ request, params }) => {
    const g = exiger(request, 'colis.gerer')
    if (g.refus !== null) return g.refus
    const c = db().colis.find((x) => x.id === params.id)
    if (c === undefined || !visibleParCompagnie(g.compte, c.compagnieId)) return erreur(404, 'INTROUVABLE', 'Colis introuvable.')
    const body = await corps<{ etape?: EtapeColis; voyageId?: string }>(request)
    const attendue = ORDRE_COLIS[ORDRE_COLIS.indexOf(c.statut) + 1]
    if (body.etape === undefined || body.etape !== attendue) {
      return erreur(409, 'ETAPE_INVALIDE', `Étape attendue : ${attendue ?? 'aucune (colis remis)'}.`)
    }
    if (body.etape === 'remis') return erreur(409, 'REMISE_AVEC_PREUVE', 'La remise se fait avec une preuve (nom et pièce du destinataire).')
    if (body.etape === 'charge') {
      const v = db().voyages.find((x) => x.id === body.voyageId)
      if (v === undefined || v.compagnieId !== c.compagnieId) {
        return erreur(422, 'VOYAGE_OBLIGATOIRE', 'Choisissez le voyage qui transporte le colis (il rejoint son manifeste).', [{ field: 'voyageId', message: 'Voyage obligatoire.' }])
      }
      c.voyageId = v.id
    }
    const gare = db().gares.find((x) => x.id === g.compte.gareId)
    c.statut = body.etape
    c.historique.push({ etape: body.etape, date: new Date().toISOString(), auteur: nomComplet(g.compte), lieu: body.etape === 'en_transit' ? 'En route' : (gare?.nom ?? '') })
    auditer(g.compte, `Colis : étape ${body.etape}`, 'colis', c.id, undefined, { etape: body.etape })
    return ok(c)
  }),
  http.post(`${API}/colis/:id/remise`, async ({ request, params }) => {
    const g = exiger(request, 'colis.gerer')
    if (g.refus !== null) return g.refus
    const c = db().colis.find((x) => x.id === params.id)
    if (c === undefined || !visibleParCompagnie(g.compte, c.compagnieId)) return erreur(404, 'INTROUVABLE', 'Colis introuvable.')
    if (c.statut !== 'disponible') return erreur(409, 'NON_DISPONIBLE', 'Le colis doit être « disponible » en gare pour être remis.')
    const body = await corps<{ recuPar?: string; piece?: string }>(request)
    const manquants = champsManquants(body as Record<string, unknown>, { recuPar: 'Le nom de la personne', piece: 'La pièce d’identité' })
    if (manquants.length > 0) return erreur(422, 'PREUVE_OBLIGATOIRE', 'La remise exige une preuve.', manquants)
    const maintenant = new Date().toISOString()
    c.statut = 'remis'
    c.preuveRemise = { recuPar: body.recuPar ?? '', piece: body.piece ?? '', date: maintenant }
    const gare = db().gares.find((x) => x.id === g.compte.gareId)
    c.historique.push({ etape: 'remis', date: maintenant, auteur: nomComplet(g.compte), lieu: gare?.nom ?? '' })
    auditer(g.compte, 'Remise d’un colis contre preuve', 'colis', c.id, undefined, c.preuveRemise)
    return ok(c)
  }),
]

