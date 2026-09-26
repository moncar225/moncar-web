import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Mise en page commune des pages d'erreur (403, 404). */
export function ErrorLayout({ code, titleId, children }: { code: string; titleId: string; children: ReactNode }) {
  return (
    <main className="error-page">
      <Link to="/" className="error-page__brand">
        <img src="/brand/logo.png" alt="Logo MON CAR" width={40} height={40} />
        MON CAR
      </Link>
      <section className="state-block" aria-labelledby={titleId}>
        <p className="state-block__code" aria-hidden="true">
          {code}
        </p>
        {children}
      </section>
    </main>
  )
}
