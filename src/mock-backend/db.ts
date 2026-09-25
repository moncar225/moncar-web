/**
 * ⚠️ FAUX BACKEND — état en mémoire, conservé dans le navigateur
 * (localStorage) pour que les démonstrations survivent à un rechargement.
 * Régénéré chaque jour, ou à la demande (« Réinitialiser la démo »).
 */
import { construireDb, MOCK_DB_VERSION, type MockDb } from './seed'

const STORAGE_KEY = 'moncar:mock-db'

let state: MockDb | null = null

function aujourdHui(): string {
  return new Date().toISOString().slice(0, 10)
}

function charger(): MockDb {
  if (typeof window !== 'undefined' && import.meta.env.MODE !== 'test') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw !== null) {
        const parsed = JSON.parse(raw) as MockDb
        if (parsed.version === MOCK_DB_VERSION && parsed.generatedOn === aujourdHui()) return parsed
      }
    } catch {
      // stockage indisponible ou corrompu : on régénère
    }
  }
  return construireDb()
}

export function db(): MockDb {
  if (state === null) state = charger()
  return state
}

export function sauvegarder(): void {
  if (state === null || typeof window === 'undefined' || import.meta.env.MODE === 'test') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // quota dépassé : la démo continue en mémoire
  }
}

export function reinitialiserDb(): void {
  state = construireDb()
  sauvegarder()
}

/** Numéro séquentiel métier (billet, colis, litige…). */
export function prochainNumero(sequence: string): number {
  const d = db()
  const n = (d.sequences[sequence] ?? 1) + 1
  d.sequences[sequence] = n
  return n
}

export function nouvelId(prefixe: string): string {
  return `${prefixe}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`
}
