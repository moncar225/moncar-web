import type { CelluleSiege, PlanSieges } from '@/domain/types'

interface SeatMapProps {
  plan: PlanSieges
  /** Sièges occupés sur le segment demandé (renvoyés par le serveur). */
  pris?: ReadonlyArray<string>
  selection?: ReadonlyArray<string>
  onSelect?: (numero: string) => void
  /** Mode édition : clic sur n'importe quelle cellule. */
  onCellClick?: (cellule: CelluleSiege) => void
  legende?: boolean
}

function libelle(c: CelluleSiege): string {
  switch (c.type) {
    case 'chauffeur':
      return 'Poste du chauffeur'
    case 'porte':
      return 'Porte'
    case 'couloir':
      return 'Couloir'
    case 'vide':
      return 'Emplacement vide'
    default:
      return `Siège ${c.numero ?? ''}${c.classe === 'vip' ? ' VIP' : ''}`
  }
}

/** Plan réel du véhicule (CDC §10) : disponible, sélectionné, occupé, indisponible. */
export function SeatMap({ plan, pris = [], selection = [], onSelect, onCellClick, legende = true }: SeatMapProps) {
  const cellule = (rang: number, col: number) => plan.cellules.find((c) => c.rang === rang && c.col === col)
  return (
    <div className="seat-map-wrap">
      <div
        className="seat-map"
        role="grid"
        aria-label="Plan des sièges"
        style={{ gridTemplateColumns: `repeat(${plan.colonnes}, 2.6rem)` }}
      >
        {Array.from({ length: plan.rangees }).flatMap((_, rang) =>
          Array.from({ length: plan.colonnes }).map((__, col) => {
            const c = cellule(rang, col) ?? { rang, col, type: 'vide' as const }
            const numero = c.numero ?? ''
            const estSiege = c.type === 'siege'
            const occupe = estSiege && pris.includes(numero)
            const choisi = estSiege && selection.includes(numero)
            const classes = [
              'seat',
              `seat--${c.type}`,
              c.classe === 'vip' ? 'seat--vip' : '',
              occupe ? 'seat--pris' : '',
              choisi ? 'seat--choisi' : '',
            ]
              .filter(Boolean)
              .join(' ')
            const cliquable = onCellClick !== undefined || (onSelect !== undefined && estSiege && !occupe)
            return (
              <button
                key={`${rang}-${col}`}
                type="button"
                role="gridcell"
                className={classes}
                disabled={!cliquable}
                aria-selected={choisi}
                aria-label={`${libelle(c)}${occupe ? ' — occupé' : choisi ? ' — sélectionné' : ''}`}
                title={libelle(c)}
                onClick={() => {
                  if (onCellClick !== undefined) onCellClick(c)
                  else if (estSiege && !occupe) onSelect?.(numero)
                }}
              >
                {c.type === 'siege' ? numero : c.type === 'chauffeur' ? '🚍' : c.type === 'porte' ? '🚪' : ''}
              </button>
            )
          }),
        )}
      </div>
      {legende && (
        <ul className="seat-legend" aria-label="Légende">
          <li><span className="seat seat--siege" aria-hidden="true" /> Disponible</li>
          <li><span className="seat seat--siege seat--choisi" aria-hidden="true" /> Sélectionné</li>
          <li><span className="seat seat--siege seat--pris" aria-hidden="true" /> Occupé / réservé</li>
          <li><span className="seat seat--siege seat--vip" aria-hidden="true" /> VIP</li>
        </ul>
      )}
    </div>
  )
}
