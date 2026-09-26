import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Alert, Button, Input } from '@/components/ui'
import { useAuth } from '@/app/providers/AuthProvider'
import { ApiErrorAlert } from '@/features/shared/components/Page'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { AuthShell } from '../components/AuthShell'
import { changerMotDePasseTemporaire, espaceAccueil } from '@/services/auth'

const REGLES = [
  { id: 'long', libelle: '8 caractères minimum', test: (v: string) => v.length >= 8 },
  { id: 'lettre', libelle: 'Au moins une lettre', test: (v: string) => /[A-Za-z]/.test(v) },
  { id: 'chiffre', libelle: 'Au moins un chiffre', test: (v: string) => /[0-9]/.test(v) },
]

/** Changement obligatoire du mot de passe temporaire à la 1re connexion (CDC). */
export function PasswordChangePage() {
  useDocumentTitle('MON CAR — Nouveau mot de passe')
  const { status, session, refresh, logout } = useAuth()
  const navigate = useNavigate()
  const [mdp, setMdp] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<unknown>(null)

  if (status === 'unauthenticated') return <Navigate to="/connexion" replace />
  if (session === null) return null

  const reglesOk = REGLES.every((r) => r.test(mdp))
  const identiques = mdp === confirmation

  async function soumettre(e: FormEvent) {
    e.preventDefault()
    if (!reglesOk || !identiques || session === null) return
    setEnCours(true)
    setErreur(null)
    try {
      await changerMotDePasseTemporaire(mdp)
      await refresh()
      navigate(espaceAccueil(session), { replace: true })
    } catch (err) {
      setErreur(err)
    } finally {
      setEnCours(false)
    }
  }

  return (
    <AuthShell>
      <section className="auth-card" aria-labelledby="pwd-title">
        <p className="auth-card__eyebrow">Première connexion</p>
        <h1 id="pwd-title">Choisissez votre mot de passe</h1>
        {session.motDePasseTemporaire === true && (
          <Alert variant="warning">
            Votre compte a été créé avec un mot de passe temporaire. Vous devez le remplacer avant de continuer.
          </Alert>
        )}
        <form onSubmit={(e) => void soumettre(e)} noValidate>
          <Input
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            value={mdp}
            onChange={(e) => setMdp(e.target.value)}
          />
          <ul className="regles-mdp" aria-label="Règles du mot de passe">
            {REGLES.map((r) => (
              <li key={r.id} className={r.test(mdp) ? 'is-ok' : undefined}>
                <span aria-hidden="true">{r.test(mdp) ? '✓' : '○'}</span> {r.libelle}
              </li>
            ))}
          </ul>
          <Input
            label="Confirmation"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            error={confirmation !== '' && !identiques ? 'Les deux mots de passe sont différents.' : undefined}
          />
          <ApiErrorAlert error={erreur} />
          <Button type="submit" isLoading={enCours} disabled={!reglesOk || !identiques}>
            Enregistrer et continuer
          </Button>
          <Button type="button" variant="ghost" onClick={logout}>
            Se déconnecter
          </Button>
        </form>
      </section>
    </AuthShell>
  )
}
