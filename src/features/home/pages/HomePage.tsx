import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui'
import type { IconName } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { env } from '@/lib/env'

const services: Array<{ icon: IconName; titre: string; texte: string }> = [
  {
    icon: 'bus',
    titre: 'Transport de voyageurs',
    texte: 'Lignes, arrêts, plans de sièges et vente au guichet ou dans l’application, siège par siège et segment par segment.',
  },
  {
    icon: 'colis',
    titre: 'Envoi de colis',
    texte: 'Enregistrement en gare, suivi de bout en bout et remise sécurisée contre pièce d’identité.',
  },
  {
    icon: 'vehicules',
    titre: 'Location de véhicules',
    texte: 'Agences et propriétaires publient leurs véhicules, avec ou sans chauffeur, et suivent leurs revenus.',
  },
]

const espaces: Array<{ to: string; icon: IconName; titre: string; description: string; points: string[]; cta: string }> = [
  {
    to: '/compagnie',
    icon: 'gare',
    titre: 'Compagnie',
    description: 'Pilotez l’exploitation de votre compagnie de transport, de la gare à la direction.',
    points: ['Caisse guichet et chef de gare', 'Planning, flotte et lignes', 'Finances et tableau de bord'],
    cta: 'Accéder à l’espace compagnie',
  },
  {
    to: '/business',
    icon: 'vehicules',
    titre: 'Business',
    description: 'Agences de location, propriétaires VTC et chauffeurs partenaires.',
    points: ['Véhicules et disponibilités', 'Demandes de location', 'Revenus et reversements'],
    cta: 'Accéder à l’espace business',
  },
  {
    to: '/admin',
    icon: 'shield',
    titre: 'Administration',
    description: 'Supervision de la plateforme MON CAR par les équipes PROSOFT.',
    points: ['Validation des partenaires', 'Comptes, rôles et référentiels', 'Support, litiges et audit'],
    cta: 'Accéder à l’administration',
  },
]

const garanties: Array<{ icon: IconName; titre: string; texte: string }> = [
  { icon: 'key', titre: 'Double authentification', texte: 'Code SMS exigé pour les postes sensibles : direction, finances, administration.' },
  { icon: 'comptes', titre: 'Droits par poste', texte: 'Chaque collaborateur ne voit que les rubriques de son poste. Le serveur vérifie tout.' },
  { icon: 'audit', titre: 'Journal d’audit', texte: 'Ventes, annulations, clôtures de caisse et paramétrages sont tracés.' },
  { icon: 'mobile', titre: 'Paiement mobile', texte: 'Orange Money, MTN MoMo, Wave, Moov Money et carte bancaire.' },
]

/** Accueil public de moncar-web : identité, services et accès aux espaces professionnels. */
export function HomePage() {
  useDocumentTitle('MON CAR — Transport, colis et location de véhicules')
  return (
    <div className="home">
      <header className="site-header">
        <Link to="/" className="brand">
          <img src="/brand/logo.png" alt="Logo MON CAR : autocar, localisation et connectivité" className="brand__logo" />
          <span className="brand__name">MON CAR</span>
        </Link>
        <nav className="site-header__links" aria-label="Liens publics">
          <a href="#services">Services</a>
          <a href="#espaces">Espaces</a>
          <a href="#securite">Sécurité</a>
        </nav>
        <Link to="/connexion" className="mc-btn mc-btn--primary site-header__cta">
          Se connecter
        </Link>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__inner">
            <div className="hero__copy">
              <p className="hero__kicker">
                <Icon name="pin" size={14} /> Côte d’Ivoire · {env.appName}
              </p>
              <h1 id="hero-title">
                La mobilité ivoirienne, <span>pilotée depuis un seul espace.</span>
              </h1>
              <p className="hero__lead">
                Voyager, envoyer un colis, louer un véhicule : MON CAR réunit compagnies de transport, gares,
                agences de location et voyageurs sur une même plateforme.
              </p>
              <div className="hero__actions">
                <Link to="/connexion" className="mc-btn mc-btn--primary hero__btn">
                  Accéder à mon espace <Icon name="arrowRight" size={18} />
                </Link>
                <a href="#espaces" className="mc-btn hero__btn hero__btn--ghost">
                  Découvrir les espaces
                </a>
              </div>
              <ul className="hero__points">
                <li>
                  <Icon name="check" size={16} /> Vente guichet et application
                </li>
                <li>
                  <Icon name="check" size={16} /> Suivi en temps réel
                </li>
                <li>
                  <Icon name="check" size={16} /> Paiement mobile
                </li>
              </ul>
            </div>

            <div className="hero__visual" aria-hidden="true">
              <div className="ticket">
                <div className="ticket__head">
                  <span>Prochain départ</span>
                  <span className="ticket__badge">Embarquement</span>
                </div>
                <div className="ticket__route">
                  <div>
                    <strong>Abidjan</strong>
                    <small>Adjamé · 07:30</small>
                  </div>
                  <span className="ticket__line">
                    <Icon name="bus" size={18} />
                  </span>
                  <div>
                    <strong>Bouaké</strong>
                    <small>Commerce · 12:10</small>
                  </div>
                </div>
                <div className="ticket__seats">
                  {Array.from({ length: 24 }, (_, i) => (
                    <span key={i} className={i % 5 === 1 || i % 7 === 3 ? 'is-free' : i === 9 ? 'is-picked' : ''} />
                  ))}
                </div>
                <div className="ticket__foot">
                  <span>Remplissage</span>
                  <strong>82 %</strong>
                </div>
                <div className="ticket__gauge">
                  <span />
                </div>
              </div>
              <div className="hero__chip hero__chip--top">
                <Icon name="colis" size={16} /> Colis remis à Yamoussoukro
              </div>
              <div className="hero__chip hero__chip--bottom">
                <Icon name="mobile" size={16} /> Paiement Wave confirmé
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="home-section" aria-labelledby="services-title">
          <div className="home-section__head">
            <p className="eyebrow">Services</p>
            <h2 id="services-title">Trois métiers, une seule plateforme</h2>
          </div>
          <div className="feature-grid">
            {services.map((s) => (
              <article key={s.titre} className="feature">
                <span className="feature__icon" aria-hidden="true">
                  <Icon name={s.icon} size={22} />
                </span>
                <h3>{s.titre}</h3>
                <p>{s.texte}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="espaces" className="home-section home-section--tinted" aria-labelledby="espaces-title">
          <div className="home-section__head">
            <p className="eyebrow">Espaces professionnels</p>
            <h2 id="espaces-title">Un espace dédié à chaque métier</h2>
            <p>Chaque espace est protégé : les comptes sont créés par votre compagnie ou par PROSOFT.</p>
          </div>
          <div className="space-cards">
            {espaces.map((card) => (
              <Link key={card.to} to={card.to} className="space-card">
                <span className="space-card__icon" aria-hidden="true">
                  <Icon name={card.icon} size={22} />
                </span>
                <span className="space-card__title">{card.titre}</span>
                <span className="space-card__desc">{card.description}</span>
                <span className="space-card__points">
                  {card.points.map((p) => (
                    <span key={p}>
                      <Icon name="check" size={14} /> {p}
                    </span>
                  ))}
                </span>
                <span className="space-card__cta">
                  {card.cta} <Icon name="arrowRight" size={16} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section id="securite" className="home-section" aria-labelledby="securite-title">
          <div className="home-section__head">
            <p className="eyebrow">Confiance</p>
            <h2 id="securite-title">Sécurisé par conception</h2>
          </div>
          <div className="feature-grid feature-grid--4">
            {garanties.map((g) => (
              <article key={g.titre} className="feature feature--compact">
                <span className="feature__icon" aria-hidden="true">
                  <Icon name={g.icon} size={20} />
                </span>
                <h3>{g.titre}</h3>
                <p>{g.texte}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-band" aria-labelledby="cta-title">
          <div>
            <h2 id="cta-title">Prêt à prendre la route ?</h2>
            <p>Connectez-vous avec l’identifiant fourni par votre compagnie ou par PROSOFT.</p>
          </div>
          <Link to="/connexion" className="mc-btn mc-btn--primary hero__btn">
            Se connecter <Icon name="arrowRight" size={18} />
          </Link>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand">
            <img src="/brand/logo.png" alt="" width={36} height={36} />
            <div>
              <strong>MON CAR</strong>
              <p>Transport · colis · location de véhicules. Côte d’Ivoire.</p>
            </div>
          </div>
          <nav className="site-footer__links" aria-label="Liens du pied de page">
            <a href="#services">Services</a>
            <a href="#espaces">Espaces</a>
            <Link to="/connexion">Connexion</Link>
            {!env.isProd && <Link to="/catalogue">Catalogue de composants</Link>}
          </nav>
        </div>
        <p className="site-footer__legal">
          © {new Date().getFullYear()} MON CAR · PROSOFT
          {!env.isProd && <> · Environnement {env.appEnvLabel}</>}
        </p>
      </footer>
    </div>
  )
}
