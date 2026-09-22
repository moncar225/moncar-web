import { Link } from 'react-router-dom'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { TechnoDemoForm } from '@/components/demo/TechnoDemoForm'
import { env } from '@/lib/env'

const spaceCards = [
  {
    to: '/compagnie',
    title: 'Compagnie',
    description: 'Gestion des voyages, réservations et véhicules de votre compagnie.',
    cta: 'Accéder à l\u2019espace compagnie',
  },
  {
    to: '/business',
    title: 'Business',
    description: 'Agences de location, propriétaires et chauffeurs partenaires.',
    cta: 'Accéder à l\u2019espace business',
  },
  {
    to: '/admin',
    title: 'Administration',
    description: 'Supervision de la plateforme, utilisateurs et compagnies.',
    cta: 'Accéder à l\u2019administration',
  },
]

/** Accueil public de moncar-web : identité, accès aux espaces professionnels. */
export function HomePage() {
  useDocumentTitle('MON CAR — Accueil')
  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand">
          <img src="/brand/logo.png" alt="Logo MON CAR : autocar, localisation et connectivité" className="brand__logo" />
          <span className="brand__name">MON CAR</span>
        </Link>
        <nav className="site-header__links" aria-label="Liens publics">
          <a href="#espaces">Espaces</a>
        </nav>
      </header>

      <main>
        <section className="hero route-pattern">
          <div className="hero__inner">
            <p className="hero__kicker">{env.appName}</p>
            <h1>Plateforme de mobilité et transport</h1>
            <p className="hero__lead">
              Voyager, envoyer un colis, louer un véhicule : MON CAR digitalise la
              mobilité en Côte d&rsquo;Ivoire. Les espaces professionnels ci-dessous
              donnent accès aux interfaces de gestion — chaque espace est protégé
              et son contenu s&rsquo;étoffe au fil de la roadmap.
            </p>
          </div>
        </section>

        <section id="espaces" className="space-cards" aria-label="Espaces professionnels">
          {spaceCards.map((card) => (
            <Link key={card.to} to={card.to} className="space-card">
              <span className="space-card__icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17h2m14 0h2M5 17a2 2 0 1 1-4 0v-5l2-5h14l2 5v5a2 2 0 1 1-4 0Z" />
                  <circle cx="7" cy="17" r="0" />
                </svg>
              </span>
              <span className="space-card__title">{card.title}</span>
              <span className="space-card__desc">{card.description}</span>
              <span className="space-card__cta">{card.cta} →</span>
            </Link>
          ))}
        </section>

        <TechnoDemoForm />
      </main>

      <footer className="site-footer">
        <p>MON CAR — transport · colis · location de véhicules. Côte d&rsquo;Ivoire.</p>
      </footer>
    </>
  )
}
