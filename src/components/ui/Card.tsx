import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  /** Contenu affiché à droite du titre (badge, action…). */
  headerAction?: ReactNode
  children: ReactNode
  className?: string
}

/** Carte du Design System MON CAR (surface blanche, bord, ombre légère). */
export function Card({ title, headerAction, children, className }: CardProps) {
  return (
    <section className={['mc-card', className].filter(Boolean).join(' ')}>
      {title !== undefined && (
        <header className="mc-card__header">
          <h3 className="mc-card__title">{title}</h3>
          {headerAction}
        </header>
      )}
      <div className="mc-card__body">{children}</div>
    </section>
  )
}
