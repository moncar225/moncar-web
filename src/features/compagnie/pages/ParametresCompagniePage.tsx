import { useState } from 'react'
import { Alert, Button, Card, Input, useToast } from '@/components/ui'
import { useAuth } from '@/app/providers/AuthProvider'
import type { Compagnie } from '@/domain/types'
import { ApiErrorAlert, PageHeader, QueryView } from '@/features/shared/components/Page'
import { StatutBadge } from '@/features/shared/labels'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { fcfa } from '@/lib/format'
import { useCompagnie, useModifierCompagnie } from '@/services/referentiels'

/** Fiche et paramètres de la compagnie (directeur général). */
export default function ParametresCompagniePage() {
  useDocumentTitle('MON CAR — Paramètres de la compagnie')
  const { session } = useAuth()
  const compagnie = useCompagnie(session?.compagnie?.id)
  return (
    <>
      <PageHeader title="Paramètres de la compagnie" />
      <QueryView query={compagnie} loading="Chargement de la fiche…">
        {(c) => <Fiche compagnie={c} />}
      </QueryView>
    </>
  )
}

function Fiche({ compagnie }: { compagnie: Compagnie }) {
  const modifier = useModifierCompagnie()
  const { showToast } = useToast()
  const [f, setF] = useState({
    telephone: compagnie.telephone,
    email: compagnie.email,
    adresse: compagnie.adresse,
    accepteColis: compagnie.accepteColis,
  })
  return (
    <div className="split">
      <Card title="Coordonnées et services">
        <div className="form-grid">
          <Input label="Raison sociale" value={compagnie.nom} disabled hint="Modifiable par PROSOFT uniquement." />
          <Input label="Sigle" value={compagnie.sigle} disabled />
          <Input label="Téléphone" value={f.telephone} onChange={(e) => setF({ ...f, telephone: e.target.value })} />
          <Input label="E-mail" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <Input className="form-grid--full" label="Adresse" value={f.adresse} onChange={(e) => setF({ ...f, adresse: e.target.value })} />
          <label className="row form-grid--full">
            <input type="checkbox" checked={f.accepteColis} onChange={(e) => setF({ ...f, accepteColis: e.target.checked })} />
            La compagnie accepte les colis (service « Envoyer un colis »)
          </label>
        </div>
        <ApiErrorAlert error={modifier.error} />
        <div className="form-actions">
          <Button
            isLoading={modifier.isPending}
            onClick={() =>
              modifier.mutate({ id: compagnie.id, ...f }, { onSuccess: () => showToast('Paramètres enregistrés.', 'success') })
            }
          >
            Enregistrer
          </Button>
        </div>
      </Card>
      <Card title="Contrat MON CAR">
        <dl className="stack">
          <div>
            <dt className="muted">Statut</dt>
            <dd><StatutBadge table="validation" statut={compagnie.statut} /></dd>
          </div>
          <div>
            <dt className="muted">Commission PROSOFT sur les ventes en ligne</dt>
            <dd><strong>{compagnie.commissionPct} %</strong></dd>
          </div>
          <div>
            <dt className="muted">Frais d’opération facturés au client</dt>
            <dd><strong>{fcfa(compagnie.fraisOperation)}</strong> par billet</dd>
          </div>
        </dl>
        <Alert variant="info">
          Ces valeurs sont fixées par PROSOFT (arbitrage A-4 en attente) et ne sont pas modifiables par la compagnie.
        </Alert>
      </Card>
    </div>
  )
}
