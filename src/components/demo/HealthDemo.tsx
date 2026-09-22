import { useHealthQuery } from '@/api/client/queries';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

export function HealthDemo() {
  const { status, data, error, refetch, isFetching } = useHealthQuery();

  if (status === 'pending') {
    return (
      <div className="mc-demo-panel" aria-busy="true" data-testid="health-demo">
        <div className="mc-demo-panel__header">
          <h3 className="mc-demo-panel__title">État du service</h3>
          <Badge variant="neutral">Vérification…</Badge>
        </div>
        <div className="mc-demo-panel__body">
          <Spinner />
          <p className="mc-demo-panel__hint">Appel HTTP via TanStack Query → client API → MSW.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="mc-demo-panel" data-testid="health-demo">
        <div className="mc-demo-panel__header">
          <h3 className="mc-demo-panel__title">État du service</h3>
          <Badge variant="danger">Erreur</Badge>
        </div>
        <div className="mc-demo-panel__body">
          <ErrorState
            title="Échec de la vérification"
            message={error.message}
            incidentId={error.incidentId}
            onRetry={() => { void refetch(); }}
          />
        </div>
      </div>
    );
  }

  if (data.status !== 'ok') {
    return (
      <div className="mc-demo-panel" data-testid="health-demo">
        <div className="mc-demo-panel__header">
          <h3 className="mc-demo-panel__title">État du service</h3>
          <Badge variant="warning">Sans réponse</Badge>
        </div>
        <div className="mc-demo-panel__body">
          <EmptyState
            title="Aucune donnée exploitable"
            message="Le serveur n'a pas retourné d'état reconnu."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mc-demo-panel" data-testid="health-demo">
      <div className="mc-demo-panel__header">
        <h3 className="mc-demo-panel__title">État du service</h3>
        <Badge variant="success" aria-live="polite">
          {data.mock === true ? 'Connecté · MSW' : 'Connecté · API réelle'}
        </Badge>
      </div>
      <div className="mc-demo-panel__body">
        <dl className="mc-demo-panel__list">
          <div>
            <dt>Service</dt>
            <dd>{data.service}</dd>
          </div>
          <div>
            <dt>Statut</dt>
            <dd>
              <code>200 OK</code>
            </dd>
          </div>
          {data.note !== undefined && (
            <div>
              <dt>Note de transition</dt>
              <dd className="mc-demo-panel__note">{data.note}</dd>
            </div>
          )}
        </dl>
        {isFetching && <Spinner size="sm" label="Rafraîchissement en cours" />}
      </div>
    </div>
  );
}
