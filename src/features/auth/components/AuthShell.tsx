import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui'
import type { IconName } from '@/components/ui'

const ATOUTS: Array<{ icon: IconName; texte: string }> = [
  { icon: 'gare', texte: 'Caisse, gare, colis et planning de votre compagnie' },
  { icon: 'vehicules', texte: 'Véhicules, demandes et revenus de location' },
  { icon: 'shield', texte: 'Accès par poste et double authentification' },
]

/**
 * Mise en page des écrans d'authentification : panneau de marque (bleu
 * nuit) à gauche, carte de formulaire à droite ; empilés sur mobile.
 */
export function AuthShell({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-page__brand" aria-label="MON CAR PRO">
        <Link to="/" className="auth-page__logo">
          <img src="/brand/logo.png" alt="Logo MON CAR" />
          <span>
            MON CAR <em>PRO</em>
          </span>
        </Link>
        <div className="auth-page__pitch">
          <h2>L’espace des professionnels de la mobilité.</h2>
          <ul>
            {ATOUTS.map((a) => (
              <li key={a.texte}>
                <span aria-hidden="true">
                  <Icon name={a.icon} size={18} />
                </span>
                {a.texte}
              </li>
            ))}
          </ul>
        </div>
        <p className="auth-page__legal">© {new Date().getFullYear()} MON CAR · PROSOFT</p>
      </section>
      <div className="auth-page__main">
        {children}
        {aside}
      </div>
    </main>
  )
}
