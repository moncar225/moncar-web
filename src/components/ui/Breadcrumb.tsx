import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  /** Lien interne ; absent pour l'élément courant. */
  to?: string
}

/** Fil d'Ariane du Design System MON CAR. */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="mc-breadcrumb" aria-label="Fil d'Ariane">
      <ol>
        {items.map((item, index) => {
          const current = item.to === undefined || index === items.length - 1
          return (
            <li key={item.label}>
              {current || item.to === undefined ? (
                <span aria-current="page">{item.label}</span>
              ) : (
                <Link to={item.to}>{item.label}</Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
