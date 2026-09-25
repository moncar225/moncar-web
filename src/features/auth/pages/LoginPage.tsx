import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/app/providers/AuthProvider'
import { ApiErrorAlert } from '@/features/shared/components/Page'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { env } from '@/lib/env'
import { chargerSession, connexion, espaceAccueil, verifierA2f, type ReponseConnexion } from '@/services/auth'
import { sessionManager } from '@/api/client'

/** Comptes du faux backend (dev / recette uniquement). */
const COMPTES_DEMO = [
  { id: 'dg@lagune.demo', libelle: 'Directeur général', entite: 'Lagune Express' },
  { id: 'finance@lagune.demo', libelle: 'Responsable financier', entite: 'Lagune Express' },
  { id: 'rh@lagune.demo', libelle: 'Gares / RH', entite: 'Lagune Express' },
  { id: 'flotte@lagune.demo', libelle: 'Gestionnaire de flotte', entite: 'Lagune Express' },
  { id: 'commercial@lagune.demo', libelle: 'Service commercial', entite: 'Lagune Express' },
  { id: 'chefgare@lagune.demo', libelle: 'Chef de gare', entite: 'Gare d’Adjamé' },
  { id: 'caisse@lagune.demo', libelle: 'Caisse', entite: 'Gare d’Adjamé' },
  { id: 'colis@lagune.demo', libelle: 'Service colis', entite: 'Gare d’Adjamé' },
  { id: 'nouveau@lagune.demo', libelle: 'Caisse (mot de passe temporaire)', entite: 'Mot de passe Temp1234', temporaire: true },
  { id: 'admin@prosoft.demo', libelle: 'Super administrateur', entite: 'PROSOFT' },
  { id: 'validation@prosoft.demo', libelle: 'Validation des partenaires', entite: 'PROSOFT' },
  { id: 'support@prosoft.demo', libelle: 'Support et litiges', entite: 'PROSOFT' },
  { id: 'agence@business.demo', libelle: 'Agence de location', entite: 'BUSINESS' },
  { id: 'vtc@business.demo', libelle: 'Propriétaire VTC', entite: 'BUSINESS' },
]

/** Connexion des postes web (AUTH-002) + double authentification des rôles sensibles. */
export function LoginPage() {
  useDocumentTitle('MON CAR — Connexion')
  const { status, session, setSession } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const retour = params.get('retour')
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [defi, setDefi] = useState<{ defi: string; destination: string } | null>(null)
  const [code, setCode] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<unknown>(null)

  if (status === 'authenticated' && session !== null) {
    return <Navigate to={retour ?? espaceAccueil(session)} replace />
  }

  async function terminer(reponse: ReponseConnexion) {
    if (reponse.etape === 'a2f') {
      setDefi({ defi: reponse.defi, destination: reponse.destination })
      return
    }
    // Le jeton doit être en place avant GET /me.
    const stored = {
      token: reponse.token,
      refreshToken: reponse.refreshToken,
      expiresAt: reponse.expiresAt,
      userId: reponse.userId,
    }
    sessionManager.set(stored)
    const user = await chargerSession()
    setSession(user, stored)
    navigate(user.motDePasseTemporaire === true ? '/mot-de-passe' : (retour ?? espaceAccueil(user)), { replace: true })
  }

  async function soumettre(e: FormEvent) {
    e.preventDefault()
    setErreur(null)
    setEnCours(true)
    try {
      await terminer(defi === null ? await connexion(identifiant, motDePasse) : await verifierA2f(defi.defi, code))
    } catch (err) {
      setErreur(err)
    } finally {
      setEnCours(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-page__grid">
        <section className="auth-card" aria-labelledby="login-title">
          <div className="auth-card__brand">
            <img src="/brand/logo.png" alt="" />
            <strong>MON CAR PRO Web</strong>
          </div>
          <h1 id="login-title">{defi === null ? 'Connexion' : 'Vérification en deux étapes'}</h1>
          <form onSubmit={(e) => void soumettre(e)} noValidate>
            {defi === null ? (
              <>
                <Input
                  label="Téléphone ou e-mail"
                  autoComplete="username"
                  value={identifiant}
                  onChange={(e) => setIdentifiant(e.target.value)}
                  required
                />
                <Input
                  label="Mot de passe"
                  type="password"
                  autoComplete="current-password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                />
              </>
            ) : (
              <Input
                label={`Code reçu par SMS au ${defi.destination}`}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                hint={env.enableMocks ? 'Démonstration : code 123456.' : undefined}
                required
              />
            )}
            <ApiErrorAlert error={erreur} />
            <Button
              type="submit"
              isLoading={enCours}
              disabled={defi === null ? identifiant === '' || motDePasse === '' : code.length !== 6}
            >
              {defi === null ? 'Se connecter' : 'Valider le code'}
            </Button>
            {defi !== null && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDefi(null)
                  setCode('')
                }}
              >
                Revenir
              </Button>
            )}
          </form>
          <p className="muted" style={{ marginTop: 'var(--mc-space-4)', fontSize: 'var(--mc-font-size-sm)' }}>
            Les comptes sont créés par votre compagnie ou par PROSOFT. Mot de passe oublié : contactez votre
            administrateur. <Link to="/">Accueil</Link>
          </p>
        </section>

        {env.enableMocks && !env.isProd && (
          <section className="demo-accounts" aria-labelledby="demo-accounts-title">
            <h2 id="demo-accounts-title">Comptes de démonstration</h2>
            <p className="muted">
              Faux backend (en attendant l’API) — mot de passe <strong>Moncar2026</strong>, code SMS{' '}
              <strong>123456</strong>.
            </p>
            <ul>
              {COMPTES_DEMO.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setDefi(null)
                      setIdentifiant(c.id)
                      setMotDePasse(c.temporaire === true ? 'Temp1234' : 'Moncar2026')
                    }}
                  >
                    {c.libelle}
                    <small>{c.entite}</small>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
