/** Formats français partagés (montants F CFA, dates, heures). */

const nombre = new Intl.NumberFormat('fr-FR')

export function fcfa(montant: number): string {
  return `${nombre.format(montant)} F`
}

export function entier(n: number): string {
  return nombre.format(n)
}

export function date(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function dateLongue(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function heure(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function dateHeure(iso: string): string {
  return `${date(iso)} ${heure(iso)}`
}

/**
 * Jour calendaire LOCAL (AAAA-MM-JJ) d'un instant. Ne jamais utiliser
 * `toISOString().slice(0, 10)`, qui donne le jour UTC : décalé la nuit
 * hors de l'UTC+0 (ex. Bénin, UTC+1).
 */
export function jourDe(instant: string | Date): string {
  const d = typeof instant === 'string' ? new Date(instant) : instant
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const jj = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${jj}`
}

/** Date locale AAAA-MM-JJ (décalage de `offset` jours). */
export function jourLocal(offset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return jourDe(d)
}

/** Export CSV (séparateur « ; » pour Excel en français, BOM UTF-8). */
export function telechargerCsv(nomFichier: string, lignes: Array<Array<string | number>>): void {
  const contenu = lignes
    .map((l) => l.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(';'))
    .join('\r\n')
  const blob = new Blob([`\uFEFF${contenu}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomFichier
  a.click()
  URL.revokeObjectURL(url)
}
