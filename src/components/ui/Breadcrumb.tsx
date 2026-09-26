import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  /** Lien interne ; absent pour l'élément courant. */
  to?: string
}

/** Fil d'Ariane du Design System MON CAR. */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="mc-breadcrumb" aria-label="Fil d’Ariane">
      <ol>
        {items.map((item, index) => {
          const current = index === items.length - 1
          return (
            <li key={item.label}>
              {current ? (
                <span aria-current="page">{item.label}</span>
              ) : item.to === undefined ? (
                <span>{item.label}</span>
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
