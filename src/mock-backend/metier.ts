/**
 * ⚠️ FAUX BACKEND — règles métier qui, en production, vivent côté serveur
 * (principe n°3 : « l'interface propose, le serveur décide »). Les écrans web
 * n'en contiennent aucune copie : ils affichent ce que renvoie l'API.
 */
import type { Colis, Ligne, Reservation, Vehicule, Voyage } from '@/domain/types'
import { db } from './db'
import { numerosSieges } from './seed'

export function ligneDe(voyage: Voyage): Ligne | undefined {
  return db().lignes.find((l) => l.id === voyage.ligneId)
}

export function vehiculeDe(voyage: Voyage): Vehicule | undefined {
  return voyage.vehiculeId === undefined ? undefined : db().vehicules.find((v) => v.id === voyage.vehiculeId)
}

/** Deux segments [a, b[ et [c, d[ se chevauchent (contrainte d'exclusion). */
export function chevauche(a: number, b: number, c: number, d: number): boolean {
  return a < d && c < b
}

export function reservationActive(r: Reservation): boolean {
  return r.statut !== 'annulee'
}

/** Sièges pris sur au moins un segment de [montee, descente[. */
export function siegesOccupes(voyageId: string, montee: number, descente: number): Set<string> {
  const pris = new Set<string>()
  for (const r of db().reservations) {
    if (r.voyageId !== voyageId || !reservationActive(r)) continue
    if (chevauche(montee, descente, r.montee, r.descente)) pris.add(r.siege)
  }
  return pris
}

export function prixSegment(voyage: Voyage, ligne: Ligne, montee: number, descente: number): number {
  const dernier = ligne.arrets[ligne.arrets.length - 1]
  const kmTotal = dernier?.kmDepuisOrigine ?? 1
  const km = (ligne.arrets[descente]?.kmDepuisOrigine ?? kmTotal) - (ligne.arrets[montee]?.kmDepuisOrigine ?? 0)
  return Math.max(1000, Math.round((voyage.prixPlein * km) / kmTotal / 100) * 100)
}

export function heurePassage(voyage: Voyage, ligne: Ligne, ordre: number): string {
  const minutes = (ligne.arrets[ordre]?.minutesDepuisOrigine ?? 0) + voyage.retardMinutes
  return new Date(new Date(voyage.depart).getTime() + minutes * 60000).toISOString()
}

export interface LigneManifeste {
  billetNumero: string
  siege: string
  passager: string
  telephone: string
  montee: string
  descente: string
  statut: Reservation['statut']
  canal: Reservation['canal']
  bagages: number
}

export interface ArretManifeste {
  ordre: number
  nom: string
  heurePrevue: string
  montees: number
  descentes: number
  aBordApres: number
}

/** Manifeste par segment : vue recalculée, jamais ajustée à la main (MAN-001). */
export function manifeste(voyage: Voyage) {
  const ligne = ligneDe(voyage)
  const vehicule = vehiculeDe(voyage)
  const reservations = db()
    .reservations.filter((r) => r.voyageId === voyage.id && reservationActive(r))
    .sort((a, b) => Number(a.siege) - Number(b.siege))
  const nomArret = (o: number) => ligne?.arrets[o]?.nom ?? `Arrêt ${o}`
  const passagers: LigneManifeste[] = reservations.map((r) => ({
    billetNumero: r.billetNumero,
    siege: r.siege,
    passager: r.passager.nom,
    telephone: r.passager.telephone,
    montee: nomArret(r.montee),
    descente: nomArret(r.descente),
    statut: r.statut,
    canal: r.canal,
    bagages: r.bagages,
  }))
  let aBord = 0
  const arrets: ArretManifeste[] = (ligne?.arrets ?? []).map((a) => {
    const montees = reservations.filter((r) => r.montee === a.ordre).length
    const descentes = reservations.filter((r) => r.descente === a.ordre).length
    aBord += montees - descentes
    return {
      ordre: a.ordre,
      nom: a.nom,
      heurePrevue: ligne === undefined ? voyage.depart : heurePassage(voyage, ligne, a.ordre),
      montees,
      descentes,
      aBordApres: aBord,
    }
  })
  const colis = db().colis.filter((c) => c.voyageId === voyage.id)
  return {
    capacite: vehicule === undefined ? 0 : numerosSieges(vehicule.plan).length,
    passagers,
    arrets,
    colis: colis.map((c) => ({ numero: c.numero, nature: c.nature, poidsKg: c.poidsKg, statut: c.statut })),
    embarques: reservations.filter((r) => r.statut === 'embarquee' || r.statut === 'descendue').length,
  }
}

/** Information anticipée « gare suivante » (MAN-002). */
export function gareSuivante(voyage: Voyage) {
  const ligne = ligneDe(voyage)
  if (ligne === undefined) return null
  const prochain = Math.min(voyage.dernierArretFranchi + 1, ligne.arrets.length - 1)
  const arret = ligne.arrets[prochain]
  if (arret === undefined) return null
  const reservations = db().reservations.filter((r) => r.voyageId === voyage.id && reservationActive(r))
  const aDebarquer = reservations.filter((r) => r.descente === prochain)
  const aEmbarquer = reservations.filter((r) => r.montee === prochain)
  const colisADecharger: Colis[] = db().colis.filter(
    (c) => c.voyageId === voyage.id && arret.gareId !== undefined && c.gareArriveeId === arret.gareId,
  )
  return {
    ordre: prochain,
    arret: arret.nom,
    heureEstimee: heurePassage(voyage, ligne, prochain),
    retardMinutes: voyage.retardMinutes,
    aDebarquer: aDebarquer.map((r) => ({ siege: r.siege, passager: r.passager.nom, bagages: r.bagages })),
    aEmbarquer: aEmbarquer.map((r) => ({ siege: r.siege, passager: r.passager.nom })),
    siegesLiberes: aDebarquer.map((r) => r.siege).sort((a, b) => Number(a) - Number(b)),
    bagagesADecharger: aDebarquer.reduce((s, r) => s + r.bagages, 0),
    colisADecharger: colisADecharger.map((c) => ({ numero: c.numero, nature: c.nature, destinataire: c.destinataire.nom })),
  }
}
