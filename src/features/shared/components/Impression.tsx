import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

/**
 * Zone d'impression : rendue hors de l'écran, seule imprimée pendant
 * `imprimer()` (billets, bons de colis, manifestes — exigence CDC).
 */
export function ZoneImpression({ children }: { children: ReactNode }) {
  return createPortal(<div className="print-portal">{children}</div>, document.body)
}

export function imprimer(): void {
  document.body.classList.add('impression')
  try {
    if (typeof window.print === 'function') window.print()
  } catch {
    // jsdom / navigateurs sans impression : rien à faire
  } finally {
    document.body.classList.remove('impression')
  }
}
